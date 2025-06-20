# Disaster Response Log

A full-stack application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) and integrated with Google Gemini API for location extraction and Socket.IO for real-time updates.

## Features:
* Users can report disaster incidents with descriptions.
* Google Gemini API extracts a potential location from the incident description.
* Incidents are stored in a MongoDB database.
* Real-time updates of new incidents using Socket.IO.

## Project Structure:
* `server/`: Contains the Node.js/Express.js backend.
* `client/`: Contains the React.js frontend.

## Technologies Used:
* **Backend:** Node.js, Express.js, MongoDB (Mongoose), Socket.IO, `@google/generative-ai`
* **Frontend:** React.js, Axios, Socket.IO Client
* **Database:** MongoDB Atlas (cloud hosted)
* **Deployment:** Render (Backend), Vercel (Frontend)

## Setup and Installation (Local):

### Prerequisites:
* Node.js (LTS recommended)
* MongoDB Atlas account (free tier is sufficient)
* Google Cloud account with Generative Language API enabled and an API Key

### 1. Clone the repository:
   ```bash
   git clone [https://github.com/your-username/disaster-response-app.git](https://github.com/your-username/disaster-response-app.git)
   cd disaster-response-app
   ```

### 2. Backend Setup:
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in the `server/` directory:
   ```
   MONGO_URI=your_mongodb_atlas_connection_string
   GEMINI_API_KEY=your_google_gemini_api_key
   ```
   Run the backend:
   ```bash
   npm start
   # or for development with auto-restart
   # npm run dev
   ```

### 3. Frontend Setup:
   ```bash
   cd ../client
   npm install
   ```
   No `.env` file is needed directly in `client/` for local development if `REACT_APP_BACKEND_URL` points to `http://localhost:5000` by default as configured. For deployment, Vercel will inject this variable.

   Run the frontend:
   ```bash
   npm start
   ```

   The frontend should open in your browser (usually `http://localhost:3000`).

## Deployment:

This application is designed for separate deployments of the backend and frontend.

### 1. Backend Deployment (e.g., Render)
* Connect your GitHub repository to Render.
* **Root Directory:** Set to `server/`
* **Build Command:** `npm install`
* **Start Command:** `node index.js`
* **Environment Variables:** Add `MONGO_URI` and `GEMINI_API_KEY` (with your actual values) in Render's environment settings.
* Render will provide a public URL (e.g., `https://your-backend-name.onrender.com`).

### 2. Frontend Deployment (e.g., Vercel)
* Connect your GitHub repository to Vercel.
* **Root Directory:** Set to `client/`
* Vercel usually auto-detects Create React App.
* **Environment Variables:** Add `REACT_APP_BACKEND_URL` with the value of your deployed backend URL from Render (e.g., `https://your-backend-name.onrender.com`).

## Usage:
* Open the deployed frontend URL in your browser.
* Enter an incident description.
* The application will display the incident along with an extracted location (powered by Gemini) and update in real-time.
