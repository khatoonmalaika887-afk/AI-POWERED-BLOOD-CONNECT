import ChatbotInteraction from "../models/chatbot.model.js";
import axios from "axios";
import { tavily as createTavily } from "@tavily/core";
import dotenv from "dotenv";

dotenv.config();

// Tavily API key from environment variables (do not rely on dev key in production)
const TAVILY_API_KEY = (process.env.TAVILY_API_KEY || "").trim().replace(/^['\"]/g, "").replace(/['\"]$/g, "");
const tavilyClient = TAVILY_API_KEY ? createTavily({ apiKey: TAVILY_API_KEY }) : null;

const CACHE_TTL_MS = 45000;
const tavilyCache = new Map();

// Simple rule-based chatbot responses
const responses = {
    greeting: ["Hello! How can I help you with blood donation today?", "Hi there! I'm here to assist with your blood donation queries."],
    donation_rules: ["To donate blood, you must be 18-65 years old, weigh at least 50kg, and be in good health. You can donate every 56 days."],
    blood_types: ["There are 8 main blood types: A+, A-, B+, B-, AB+, AB-, O+, O-. O- is the universal donor."],
    nearest_hospital: ["Please provide your city to find the nearest blood donation center."],
    eligibility: ["You must be healthy, not have recent tattoos or piercings, and not be pregnant or breastfeeding."],
    benefits: ["Donating blood saves lives and has health benefits like reducing heart disease risk."],
    appointment: ["You can schedule an appointment through our app or website."],
    default: ["I'm sorry, I didn't understand that. Can you please rephrase your question?"]
};

// Function to determine intent
const getIntent = (message) => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return 'greeting';
    } else if (lowerMessage.includes('rules') || lowerMessage.includes('requirements') || lowerMessage.includes('donate')) {
        return 'donation_rules';
    } else if (lowerMessage.includes('blood type') || lowerMessage.includes('types')) {
        return 'blood_types';
    } else if (lowerMessage.includes('hospital') || lowerMessage.includes('center') || lowerMessage.includes('location')) {
        return 'nearest_hospital';
    } else if (lowerMessage.includes('eligible') || lowerMessage.includes('can i') || lowerMessage.includes('able to')) {
        return 'eligibility';
    } else if (lowerMessage.includes('benefit') || lowerMessage.includes('why') || lowerMessage.includes('advantage')) {
        return 'benefits';
    } else if (lowerMessage.includes('appointment') || lowerMessage.includes('schedule') || lowerMessage.includes('book')) {
        return 'appointment';
    } else {
        return 'search'; // Changed default to search to use Tavily
    }
};

// Function to search using Tavily API
const searchWithTavily = async (query) => {
    try {
        if (!TAVILY_API_KEY || !tavilyClient) {
            return "Web search is not configured. Please set TAVILY_API_KEY in the backend .env to enable Tavily search.";
        }
        const key = (query || "").trim().toLowerCase();
        const now = Date.now();
        const hit = tavilyCache.get(key);
        if (hit && now - hit.ts < CACHE_TTL_MS) {
            return hit.value;
        }
        const save = (val) => { tavilyCache.set(key, { value: val, ts: Date.now() }); return val; };
        const response = await tavilyClient.search(`blood donation ${query}`, {
            searchDepth: "basic",
            includeAnswer: true,
            includeDomains: ["redcross.org", "who.int", "mayoclinic.org", "cdc.gov", "blood.ca"],
            maxResults: 2
        });

        const data = response || {};
        const answer = data.answer && typeof data.answer === 'string' ? data.answer.trim() : null;
        const results = Array.isArray(data.results) ? data.results : [];

        if (answer) {
            let formatted = answer;
            const top = results.slice(0, 3).map((r, i) => `${i + 1}. ${r.title} - ${r.url}`).join("\n");
            if (top) formatted += `\n\nSources:\n${top}`;
            return save(formatted);
        }

        if (results.length > 0) {
            let formattedResponse = "Here's what I found about your question:\n\n";
            results.forEach((result, index) => {
                formattedResponse += `${index + 1}. ${result.title}\n`;
                if (result.content) {
                    formattedResponse += `${result.content.substring(0, 180)}...\n`;
                }
                formattedResponse += `Source: ${result.url}\n\n`;
            });
            return save(formattedResponse);
        }
        return save("I couldn't find specific information about that. Could you try rephrasing your question?");
    } catch (error) {
        // The Tavily SDK throws plain Errors like "401 Error: {...}" rather than
        // an axios-style error.response.status, so check the message text instead.
        if (/^40[13] Error/.test(error?.message || "")) {
            return "Tavily API key is invalid or missing permissions. Please check TAVILY_API_KEY in backend .env.";
        }
        console.error("Tavily search error:", error?.message || error);
        return "I'm having trouble searching for information right now. Let me provide some general information instead.";
    }
};

// Get chatbot response
export const getChatbotResponse = async (req, res) => {
    try {
        const { message, userId, userType, sessionId, useSearch } = req.body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const intent = useSearch ? 'search' : getIntent(message);
        let botResponse;
        let confidence = 0.8;

        const withTimeout = (p, ms, fallback) => Promise.race([
            p,
            new Promise((resolve) => setTimeout(() => resolve(fallback), ms))
        ]);

        // If intent is search or useSearch flag is true, use Tavily API with timeout + fallback
        if (intent === 'search' || useSearch === true) {
            const fallback = "I'm having trouble searching right now. Here are general donation rules: You must be 18–65, at least 50kg, healthy, and can donate every 56 days.";
            botResponse = await withTimeout(searchWithTavily(message), 6000, fallback);
            confidence = 0.9; // Higher confidence for search results
        } else {
            const possibleResponses = responses[intent] || responses.default;
            botResponse = possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
        }

        // Save interaction (non-blocking: ignore errors)
        try {
            ChatbotInteraction.create({
                userId,
                userType,
                userMessage: message,
                botResponse,
                intent,
                confidence,
                sessionId,
            });
        } catch (dbErr) {
            console.error('Chatbot DB save error:', dbErr?.message || dbErr);
        }

        res.json({
            response: botResponse,
            intent,
            // interactionId intentionally omitted to avoid dependency on DB save
        });
    } catch (error) {
        console.error("Chatbot error:", error);
        // Always return a graceful fallback to avoid UI error toasts
        res.status(200).json({
            response: "Sorry, I'm having trouble responding right now. Please try again with a shorter question.",
            intent: "fallback"
        });
    }
};

// Get chat history
export const getChatHistory = async (req, res) => {
    try {
        const { userId, sessionId } = req.query;
        const whereClause = {};

        if (userId) whereClause.userId = userId;
        if (sessionId) whereClause.sessionId = sessionId;

        const history = await ChatbotInteraction.findAll({
            where: whereClause,
            order: [['createdAt', 'ASC']],
            limit: 50
        });

        res.json(history);
    } catch (error) {
        res.status(500).json({ message: "Error fetching chat history" });
    }
};

// Get chatbot analytics
export const getChatbotAnalytics = async (req, res) => {
    try {
        const totalInteractions = await ChatbotInteraction.count();
        const intentCounts = await ChatbotInteraction.findAll({
            attributes: [
                'intent',
                [ChatbotInteraction.sequelize.fn('COUNT', ChatbotInteraction.sequelize.col('intent')), 'count']
            ],
            group: ['intent'],
            raw: true
        });

        res.json({
            totalInteractions,
            intentBreakdown: intentCounts
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching chatbot analytics" });
    }
};
