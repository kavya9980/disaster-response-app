// disaster-response-app/server/index.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Server } from 'socket.io';
import http from 'http';

dotenv.config();

const app = express();
const server = http.createServer(app);

const VERCEL_FRONTEND_URL = 'https://disaster-response-app-rust.vercel.app'; // KEEP THIS AS IS, IT'S CORRECT FOR CORS

const expressCorsOptions = {
    origin: VERCEL_FRONTEND_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(expressCorsOptions));

app.use(express.json());

const io = new Server(server, {
    cors: {
        origin: VERCEL_FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

const incidentSchema = new mongoose.Schema({
    description: { type: String, required: true },
    extractedLocation: { type: String },
    timestamp: { type: Date, default: Date.now },
});

const Incident = mongoose.model('Incident', incidentSchema);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// *** IMPORTANT: TEMPORARY DEBUGGING CODE FOR GEMINI MODEL ISSUE ***
// This function will list all models available to your API key
async function listAvailableGeminiModels() {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is not set. Cannot list Gemini models.");
        return;
    }
    try {
        console.log("--- Attempting to list available Gemini models (DEBUG INFO) ---");
        const { models } = await genAI.listModels();
        console.log("Available Gemini Models and Supported Methods:");
        if (models.length === 0) {
            console.log("No models found. Check API key and project settings.");
        } else {
            for (const model of models) {
                console.log(`  Name: ${model.name}`);
                console.log(`  Description: ${model.description || 'N/A'}`);
                console.log(`  Input Token Limit: ${model.inputTokenLimit || 'N/A'}`);
                console.log(`  Output Token Limit: ${model.outputTokenLimit || 'N/A'}`);
                console.log(`  Supported Generation Methods: ${model.supportedGenerationMethods.join(', ')}`);
                console.log('--------------------');
            }
        }
        console.log("--- Finished listing models ---");
    } catch (error) {
        console.error("Error listing Gemini models (DEBUG INFO):", error.message);
    }
}

// Call this function once when the server starts up
listAvailableGeminiModels();
// *** END TEMPORARY DEBUGGING CODE ***


// The actual model you will use for content generation.
// We will update this 'gemini-pro' string once you get the correct name from the logs.
const model = genAI.getGenerativeModel({ model: "gemini-pro" });


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

        io.emit('newIncident', newIncident);

        res.status(201).json(newIncident);
    } catch (err) {
        console.error("Error saving incident:", err); // Added specific error logging for the incident save
        res.status(500).json({ message: err.message });
    }
});

io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

app.get('/', (req, res) => {
    res.send('Disaster Response Backend is running!');
});

server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
