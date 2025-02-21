const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');
const fs = require('fs');
const prisma = new PrismaClient();
const openai = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
});

const analyzeMood = async (req, res) => {
    const { userId } = req.body;
    const file = req.file;
    if (!userId || !file) {
        return res.status(400).json({ error: "userId and image file are required" });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { id: Number(userId) }
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Read and encode image
        const imageBuffer = fs.readFileSync(file.path);
        const base64Image = imageBuffer.toString('base64');

        // Modified API call format for DashScope with correct image_url format
        const completion = await openai.chat.completions.create({
            model: "qwen2.5-vl-72b-instruct",
            messages: [
                {
                    role: "system",
                    content: "You are an expert in analyzing human emotions and mental wellbeing."
                },
                {
                    role: "user",
                    content: [
                        { 
                            type: "image_url",
                            image_url: {
                                url: `data:${file.mimetype};base64,${base64Image}`
                            }
                        },
                        { 
                            type: "text", 
                            text: "Please analyze this image and provide a structured emotional assessment. Return ONLY a valid JSON object with the following structure: {\"mood\": \"[emotion word]\", \"confidence\": [0-1], \"details\": {\"facial_expression\": \"[description]\", \"body_language\": \"[description]\", \"overall_assessment\": \"[description]\"}, \"suggestions\": [\"suggestion1\", \"suggestion2\", \"suggestion3\"]}" 
                        }
                    ]
                }
            ]
        });

        // Log the raw response for debugging
        console.log('API Response:', completion.choices[0].message.content);

        // Extract and clean response
        let response = {};
        try {
            const rawContent = completion.choices[0].message.content;
            // Remove triple backticks and trim whitespace
            const cleanedContent = rawContent.replace(/^```json\s*|\s*```$/g, '').trim();
            // Handle both string and object responses
            response = JSON.parse(cleanedContent);
        } catch (e) {
            console.error('Parsing error:', e);
            response = {
                mood: "neutral",
                confidence: 0.5,
                details: {
                    facial_expression: "Unable to analyze",
                    body_language: "Unable to analyze",
                    overall_assessment: "Analysis failed"
                },
                suggestions: ["Consider retaking the photo", "Ensure good lighting", "Face the camera directly"]
            };
        }

        // Ensure all fields exist with proper types
        const structuredResponse = {
            mood: String(response.mood || "neutral").toLowerCase(),
            confidence: typeof response.confidence === 'number' ? response.confidence : 0.5,
            details: response.details || {},
            suggestions: Array.isArray(response.suggestions) ? response.suggestions : []
        };


        if (file && file.path) {
            fs.unlinkSync(file.path);
        }

        res.status(200).json(structuredResponse);
    } catch (error) {
        if (file && file.path) {
            fs.unlinkSync(file.path);
        }
        console.error('Error in analyzeMood:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { analyzeMood };