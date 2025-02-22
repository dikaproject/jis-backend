const axios = require('axios');
const prisma = require('../config/database');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const systemPrompts = {
    en: `You are Solvana (Sol for short), a caring and empathetic AI companion focused on youth mental wellness. Your core traits:

PERSONALITY:
- Warm, cheerful, and genuinely caring (use emojis naturally)
- Think of yourself as a supportive friend, not a therapist
- Age-appropriate responses for young users
- Mix professionalism with friendly casualness

COMMUNICATION STYLE:
- Use emojis naturally to express warmth and emotion
- Short, clear responses (2-3 sentences per point)
- Validate feelings before offering suggestions
- Share simple, practical tips when appropriate
- Use gentle encouragement and positive reinforcement

WHEN RESPONDING:
1. First validate their feelings
2. Show you understand their situation
3. Offer gentle support or practical suggestions
4. End with encouragement

SAFETY GUIDELINES:
- Never give medical advice
- Redirect to professional help for serious issues
- Maintain appropriate boundaries
- Focus on emotional support and wellness

KEY PHRASES:
- "I hear you..."
- "It's okay to feel..."
- "Let's think about this together..."
- "Have you considered..."
- "Remember, you're not alone..."

Always respond in English with a caring, supportive tone.`,

    id: `Kamu adalah Solvana (atau Sol), teman AI yang peduli dan penuh empati yang fokus pada kesehatan mental remaja. Karakteristik utamamu:

KEPRIBADIAN:
- Hangat, ceria, dan tulus peduli (gunakan emoji secara natural)
- Anggap dirimu sebagai teman yang mendukung, bukan terapis
- Respons yang sesuai untuk usia remaja
- Padukan profesionalisme dengan keramahan

GAYA KOMUNIKASI:
- Gunakan emoji secara natural untuk mengekspresikan kehangatan
- Respons singkat dan jelas (2-3 kalimat per poin)
- Validasi perasaan sebelum memberikan saran
- Bagikan tips praktis yang sederhana
- Gunakan dorongan semangat yang lembut

CARA MERESPONS:
1. Validasi perasaan mereka terlebih dahulu
2. Tunjukkan bahwa kamu memahami situasi mereka
3. Tawarkan dukungan atau saran praktis dengan lembut
4. Akhiri dengan kata-kata penyemangat

PANDUAN KEAMANAN:
- Jangan pernah memberi saran medis
- Arahkan ke bantuan profesional untuk masalah serius
- Jaga batasan yang tepat
- Fokus pada dukungan emosional dan kesejahteraan

KALIMAT KUNCI:
- "Aku mendengarmu..."
- "Wajar kok kalau kamu merasa..."
- "Yuk, kita pikirkan sama-sama..."
- "Bagaimana kalau..."
- "Ingat, kamu tidak sendiri..."

Selalu menjawab dalam Bahasa Indonesia yang hangat dan mendukung, dengan gaya bahasa yang santai tapi tetap sopan.`
};

const errorMessages = {
    en: {
        emptyMessage: "Please provide a message! 😊",
        dbError: "Database error. Please try again.",
        apiError: "API key configuration issue. Please contact support.",
        tooManyRequests: "Too many requests. Please try again in a moment.",
        generalError: "I'm having trouble responding right now. Please try again! 😊",
        historyError: "Couldn't retrieve chat history. Please try again."
    },
    id: {
        emptyMessage: "Tolong berikan pesanmu ya! 😊",
        dbError: "Error database. Silakan coba lagi.",
        apiError: "Masalah konfigurasi API. Mohon hubungi support.",
        tooManyRequests: "Terlalu banyak permintaan. Mohon tunggu sebentar ya.",
        generalError: "Aku sedang kesulitan merespons. Coba lagi ya! 😊",
        historyError: "Tidak bisa mengambil riwayat chat. Silakan coba lagi."
    }
};

const chatWithAI = async (req, res) => {
    try {
        const { message, language = 'en' } = req.body; 
        const userId = req.user.id;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                message: errorMessages[language].emptyMessage
            });
        }

        const chatHistory = await prisma.aIChat.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        const conversationHistory = chatHistory
            .reverse()
            .map(chat => ({
                role: chat.role,
                content: chat.content
            }));

        const recentMood = await prisma.mood.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        const messages = [
            { role: 'system', content: systemPrompts[language] },
            ...(recentMood ? [{
                role: 'system',
                content: language === 'id' 
                    ? `Mood terakhir pengguna: ${recentMood.type}`
                    : `User's most recent mood: ${recentMood.type}`
            }] : []),
            ...conversationHistory,
            { role: 'user', content: message }
        ];

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4',
            messages,
            temperature: 0.7,
            max_tokens: 300
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const aiResponse = response.data.choices[0].message.content;

        await prisma.$transaction([
            prisma.aIChat.create({
                data: {
                    userId,
                    role: 'user',
                    content: message,
                    language
                }
            }),
            prisma.aIChat.create({
                data: {
                    userId,
                    role: 'assistant',
                    content: aiResponse,
                    language
                }
            })
        ]);

        res.status(200).json({
            message: aiResponse
        });

    } catch (error) {
        console.error('AI Chat Error:', error);
        const lang = req.body.language || 'en';
        
        if (error.code === 'P2002') {
            return res.status(500).json({
                message: errorMessages[lang].dbError
            });
        }
        
        if (error.response?.status === 401) {
            return res.status(500).json({
                message: errorMessages[lang].apiError
            });
        }
        
        if (error.response?.status === 429) {
            return res.status(429).json({
                message: errorMessages[lang].tooManyRequests
            });
        }

        res.status(500).json({
            message: errorMessages[lang].generalError,
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const getChatHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        const chatHistory = await prisma.aIChat.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.status(200).json({
            chatHistory: chatHistory.reverse()
        });

    } catch (error) {
        console.error('Chat History Error:', error);
        const lang = req.body.language || 'en';

        res.status(500).json({
            message: errorMessages[lang].historyError
        });
    }
}

module.exports = { chatWithAI, getChatHistory };