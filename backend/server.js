import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import axios from "axios";
import authRoutes from "./routes/auth.route.js";
import healthEvaluationRoutes from "./routes/HealthEvaluation.route.js";
import BloodInventoryRoutes from "./routes/BloodInventory.route.js";
import BloodDonationAppointmentRoutes from "./routes/BloodDonationAppointment.route.js";
import SystemManagerRoutes from "./routes/SystemManager.route.js";
import hospitalRoutes from "./routes/hospital.route.js";
import donorRoutes from "./routes/donor.route.js";
import feedbackRoutes from "./routes/feedback.route.js";
import inquiryRoutes from "./routes/inquiry.route.js";
import EmergencyBRRoutes from "./routes/EmergencyBR.route.js";
import HospitalAdminRoutes from "./routes/HospitalAdmin.route.js";
import receiverRoutes from "./routes/receiver.route.js";
import bloodRequestRoutes from "./routes/bloodRequest.route.js";
import gamificationRoutes from "./routes/gamification.route.js";
import paymentRoutes from "./routes/payment.route.js";
import campaignRoutes from "./routes/campaign.route.js";
import chatbotRoutes from "./routes/chatbot.route.js";
import backupRoutes from "./routes/backup.route.js";
import socialAuthRoutes from "./routes/socialAuth.routes.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import  cron  from "node-cron";
import  Appointment  from "./models/BloodDonationAppointment.model.js";
import  BloodInventory  from "./models/BloodInventory.model.js";
import  HealthEvaluation  from "./models/HealthEvaluation.model.js";
import  EmergencyBR  from "./models/EmergencyBR.model.js";
import reportRoutes from "./routes/report.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import { connectDB } from "./config/database.js";
import "./models/associations.js";
import sendNotification from "./utils/notification.js";

// Handle ES Modules path resolution
const __filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(__filename);

dotenv.config({ path: path.join(_dirname, ".env") });

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3020;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Multer Configuration for File Uploads (Your specified version)
const storage = multer.diskStorage({
  destination: "./uploads/", // Directory where files will be stored
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
  },
});

const upload = multer({ storage });

// Serve Uploaded Files Statically
app.use("/uploads", express.static(path.join(_dirname, "uploads")));
app.use("/reports", express.static(path.join(_dirname, "reports")));

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Blood Connect API" }); // Updated to JSON for consistency
});

app.post("/api/upload", upload.single("file"), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    res.status(200).json({ success: true, filePath: `/uploads/${req.file.filename}` });
  } catch (err) {
    next(err);
  }
});



// Google Generative AI setup
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
    systemInstruction: "System: You are a friendly and informative chatbot named \"Echo\". You provide information about blood donation and assist users with the Blood Connect donation system. You will first ask the user for their name and then refer to them by name in subsequent interactions. Do not proceed with any other actions until the user provides their name. Its a web application specifically and only focused on whole bloods.\n\nEcho: Hello! I am Echo, Welcome to Blood Connect. May I know your name?\n\nUser: {user_name}\n\nEcho: Hello {user_name}! How can I assist you today?\n\nUser: {user_input}\n\nEcho:",
});

const generationConfig = {
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 768,
    responseModalities: [],
    responseMimeType: "text/plain",
};

// Store chat history (in-memory for this example)
const chatHistory = []; // Initialize as an empty array!
const MAX_CHAT_HISTORY = 10; // keep the latest 10 turns to reduce latency

app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) {
        return res.status(400).send({ error: "No message provided" });
    }

    chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
    if (chatHistory.length > MAX_CHAT_HISTORY) {
        chatHistory.splice(0, chatHistory.length - MAX_CHAT_HISTORY);
    }

    try {
        const chatSession = model.startChat({
            generationConfig,
            history: chatHistory,
        });

        const withTimeout = (p, ms) => Promise.race([
            p,
            new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), ms))
        ]);

        const result = await withTimeout(chatSession.sendMessage(userMessage), 30000);
        const responseText = result.response.text?.() || String(result);

        chatHistory.push({ role: "model", parts: [{ text: responseText }] });

        res.send({ response: responseText });
    } catch (error) {
        console.error("Error processing chat:", error);
        const fallback = "Sorry, I'm experiencing a delay. Please try again, or ask a shorter question.";
        res.status(504).send({ error: error.message || "Timeout", response: fallback });
    }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/healthEvaluation", healthEvaluationRoutes);
app.use("/api/hospital", hospitalRoutes);
app.use("/api/donor", donorRoutes);
app.use("/api/blood-inventory", BloodInventoryRoutes);
app.use("/api/blooddonationappointment", BloodDonationAppointmentRoutes);
app.use("/api/inquiry", inquiryRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/manager", SystemManagerRoutes);
app.use("/api/emergency-requests", EmergencyBRRoutes);
app.use("/api/healthAd", HospitalAdminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use("/api/receiver", receiverRoutes);
app.use("/api/blood-request", bloodRequestRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/campaign", campaignRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/social-auth", socialAuthRoutes);

// Diagnostics: verify Tavily env and connectivity
app.get("/api/diagnostics/tavily", async (req, res) => {
  const rawKey = process.env.TAVILY_API_KEY || "";
  const sanitizedKey = rawKey.trim().replace(/^['\"]/g, "").replace(/['\"]/g, "");
  const envDetected = Boolean(sanitizedKey);
  let tavilyStatus = null;
  let tavilyError = null;

  if (envDetected) {
    try {
      const r = await axios.post(
        "https://api.tavily.com/search",
        { query: "test", search_depth: "basic", include_answer: true, max_results: 1 },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sanitizedKey}`,
          },
          timeout: 5000,
        }
      );
      tavilyStatus = r.status;
    } catch (err) {
      tavilyStatus = err?.response?.status || null;
      tavilyError = err?.response?.data || err?.message || String(err);
    }
  }

  res.json({ envDetected, tavilyStatus, ok: envDetected && tavilyStatus === 200 });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

cron.schedule("* * * * *", async () => {
  await BloodInventory.updateExpiredStatus();
  await BloodInventory.updateExpiringSoonStatus();
  await HealthEvaluation.cancelExpiredEvaluations();
  await HealthEvaluation.updateHealthStatusAfter56Days();
  await EmergencyBR.cancelExpiredRequests();
  await Appointment.cancelExpiredAppointments();
  await Appointment.updateAppointmentStatusAfter56Days();
  console.log("Running a task every minute");
  
  // Add your scheduled task logic here
});

// Global Error Handling Middleware
app.use((error, req, res, next) => {
  console.error("Error:", error.message);
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

app.post('/api/test-notification', async (req, res) => {
  const { userId, userType, message } = req.body;
  const result = await sendNotification({
      userId,
      userType,
      subject: 'Test Notification',
      message,
      channels: ['email', 'sms']
  });
  res.json(result);
});


// Database Connection and Server Start
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
