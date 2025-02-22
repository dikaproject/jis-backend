const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

const prisma = new PrismaClient();
const openai = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
});

// Weekly rate limiter (3 requests per user per week)
const analyzeRateLimit = rateLimit({
    windowMs: 7 * 24 * 60 * 60 * 1000, // 1 week in milliseconds
    max: 3,
    keyGenerator: (req) => req.body.userId || 'anonymous',
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        message: "Weekly analysis limit reached",
        nextResetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        details: "You can analyze 3 images per week. Try again next week!"
    },
    skip: (req) => false // No skip conditions
});

// Helper function to get the start of current week
const getStartOfWeek = () => {
    const now = new Date();
    const day = now.getDay(); // 0-6, 0 being Sunday
    const diff = now.getDate() - day;
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
};

// Helper function to get remaining analyses for the week
const getRemainingAnalyses = async (userId) => {
    const startOfWeek = getStartOfWeek();

    const weeklyCount = await prisma.imageAnalysisUsage.count({
        where: {
            userId: Number(userId),
            timestamp: {
                gte: startOfWeek
            }
        }
    });

    const nextReset = new Date(startOfWeek);
    nextReset.setDate(nextReset.getDate() + 7);

    return {
        remaining: Math.max(0, 3 - weeklyCount),
        totalAllowed: 3,
        nextReset: nextReset.toISOString(),
        usedThisWeek: weeklyCount
    };
};

const analyzeMood = async (req, res) => {
    const { userId } = req.body;
    const file = req.file;

    if (!userId || !file) {
        return res.status(400).json({
            status: 'error',
            message: "Both userId and image file are required"
        });
    }

    try {
        // Check remaining analyses first
        const usageInfo = await getRemainingAnalyses(userId);
        
        if (usageInfo.remaining === 0) {
            return res.status(429).json({
                status: 'error',
                message: "Weekly analysis limit reached",
                usageInfo
            });
        }

        let imageBuffer;
        try {
            // Read image file as base64
            imageBuffer = await fs.promises.readFile(file.path);
            const base64Image = imageBuffer.toString('base64');

            // Call Qwen VL model
            const response = await openai.chat.completions.create({
                model: "qwen-vl-plus", // Use Qwen VL model
                messages: [
                    {
                        role: "system",
                        content: `You are an expert at analyzing emotions and visual details in images. Provide a comprehensive analysis in JSON format with the following structure:
                        {
                            "mood": "HAPPY/SAD/NEUTRAL/ANGRY",
                            "confidence": 0-100,
                            "analysis": "Detailed explanation of the emotional state",
                            "facial_features": {
                                "eyes": "Description of eye expression",
                                "mouth": "Description of mouth/lip expression",
                                "overall_expression": "Description of overall facial expression"
                            },
                            "body_language": "Description of posture and body language if visible",
                            "context": "Description of the setting and environmental factors",
                            "suggested_emotional_state": "Deeper interpretation of the person's emotional state"
                        }`
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                response_format: { type: "json_object" },
                max_tokens: 500
            });

            // Log usage in database
            await prisma.imageAnalysisUsage.create({
                data: {
                    userId: Number(userId)
                }
            });

            const analysis = response.choices[0].message.content;
            const parsedAnalysis = typeof analysis === 'string' ? JSON.parse(analysis) : analysis;

            res.status(200).json({
                status: 'success',
                analysis: parsedAnalysis,
                usageInfo: await getRemainingAnalyses(userId)
            });

        } finally {
            // Clean up uploaded file if it exists
            if (file && file.path) {
                fs.promises.unlink(file.path).catch(err => {
                    console.error('Error deleting file:', err);
                });
            }
        }

    } catch (error) {
        console.error('Error in analyzeMood:', error);
        res.status(500).json({
            status: 'error',
            message: error.message,
            usageInfo: await getRemainingAnalyses(userId)
        });
    }
};

// New endpoint to check usage without performing analysis
const checkUsage = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({
                status: 'error',
                message: "userId is required"
            });
        }

        const usageInfo = await getRemainingAnalyses(userId);
        
        res.status(200).json({
            status: 'success',
            usageInfo
        });

    } catch (error) {
        console.error('Error checking usage:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

module.exports = { 
    analyzeMood,
    analyzeRateLimit,
    checkUsage
};