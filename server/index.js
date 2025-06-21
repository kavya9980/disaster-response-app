// disaster-response-app/server/index.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Server } from 'socket.io'; // <--- CORRECTED THIS LINE!
import http from 'http';

dotenv.config(); // Load environment variables from .env

const app = express();
const server = http.createServer(app); // Keep this for Socket.IO

// The PORT variable itself is fine, but we use process.env.PORT directly in server.listen
// const PORT = process.env.PORT || 5000; 

// Define your Vercel frontend URL for CORS - This is based on your recent error logs
const VERCEL_FRONTEND_URL = 'https://disaster-response-n86abewty-kavya-ms-projects-f2b77050.vercel.app'; // <--- Confirmed and updated URL

// --- CORS Configuration for Express API Routes ---
const expressCorsOptions = {
    origin: VERCEL_FRONTEND_URL, // Allow requests only from your Vercel frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allow common HTTP methods
    credentials: true, // Allow sending cookies/auth headers if needed
    optionsSuccessStatus: 204 // For CORS preflight requests
};
app.use(cors(expressCorsOptions)); // Apply CORS to your Express app


// Middleware for JSON parsing
app.use(express.json());

// --- Socket.IO Configuration ---
const io = new Server(server, {
    cors: {
        origin: VERCEL_FRONTEND_URL, // Socket.IO CORS also uses your Vercel URL
        methods: ['GET', 'POST'], // Methods allowed for Socket.IO (often just GET/POST for handshakes)
        credentials: true
    }
});


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Incident Schema and Model
const incidentSchema = new mongoose.Schema({
    description: { type: String, required: true },
    extractedLocation: { type: String },
    timestamp: { type: Date, default: Date.now },
});

const Incident = mongoose.model('Incident', incidentSchema);

// Google Gemini API Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Using gemini-pro for text

// Helper function to extract location using Gemini
async function extractLocation(text) {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is not set. Location extraction will be skipped.");
        return "API Key Missing";
    }
    try {
        const prompt = `Extract the most prominent location (city, street, landmark, or specific area) from the following incident description. If no specific location is clearly mentioned, return "Unknown Location". Do not add any additional text or formatting, just the extracted location.
        Examples:
        "Flood near the old bridge on Main Street." -> "Main Street"
        "Fire reported in the industrial zone." -> "industrial zone"
        "Earthquake felt across the city." -> "city"
        "Power outage in Sector 7." -> "Sector 7"
        "Accident on highway." -> "Unknown Location"
        "Incident at local park." -> "local park"

        Incident Description: "${text}"`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text().trim();
        return textResponse;
    } catch (error) {
        console.error("Error extracting location with Gemini:", error.message);
        return "Extraction Failed (See Server Logs)";
    }
}

// API Routes
app.get('/api/incidents', async (req, res) => {
    try {
        const incidents = await Incident.find().sort({ timestamp: -1 });
        res.json(incidents);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/incidents', async (req, res) => {
    const { description } = req.body;
    if (!description) {
        return res.status(400).json({ message: 'Description is required' });
    }

    try {
        const extractedLocation = await extractLocation(description);
        const newIncident = new Incident({ description, extractedLocation });
        await newIncident.save();

        // Emit real-time update to all connected clients
        io.emit('newIncident', newIncident);

        res.status(201).json(newIncident);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Basic root route for health check or testing
app.get('/', (req, res) => {
    res.send('Disaster Response Backend is running!');
});

// Start Server - using 'server.listen' for Socket.IO integration
server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
