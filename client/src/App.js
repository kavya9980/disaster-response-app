// disaster-response-app/client/src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css'; // This will be created next for basic styling

// Determine backend URL dynamically
// In development, it's localhost. In production (on Vercel), it will be injected by Vercel.
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const socket = io(BACKEND_URL);

function App() {
    const [incidents, setIncidents] = useState([]);
    const [newIncidentDescription, setNewIncidentDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch incidents on component mount and set up Socket.IO listener
    useEffect(() => {
        const fetchIncidents = async () => {
            try {
                const response = await axios.get(`${BACKEND_URL}/api/incidents`);
                setIncidents(response.data);
                setError(null);
            } catch (err) {
                console.error("Error fetching incidents:", err);
                setError("Failed to load incidents. Please check server connection.");
            } finally {
                setLoading(false);
            }
        };

        fetchIncidents();

        // Listen for new incidents via Socket.IO
        socket.on('newIncident', (incident) => {
            setIncidents((prevIncidents) => [incident, ...prevIncidents]);
        });

        // Clean up socket listener on component unmount
        return () => {
            socket.off('newIncident');
        };
    }, []); // Empty dependency array means this runs once on mount

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newIncidentDescription.trim()) {
            alert("Incident description cannot be empty.");
            return;
        }

        try {
            // No need to set response.data to state here, as Socket.IO will emit and update
            await axios.post(`${BACKEND_URL}/api/incidents`, {
                description: newIncidentDescription,
            });
            setNewIncidentDescription(''); // Clear input field
            setError(null);
        } catch (err) {
            console.error("Error reporting incident:", err);
            setError("Failed to report incident. Please try again.");
        }
    };

    return (
        <div className="App">
            <h1>Disaster Response Log</h1>

            <form onSubmit={handleSubmit} className="incident-form">
                <textarea
                    placeholder="Describe the incident (e.g., 'Flood at Main Street, near the old library')"
                    value={newIncidentDescription}
                    onChange={(e) => setNewIncidentDescription(e.target.value)}
                    rows="4"
                    cols="50"
                    required
                ></textarea>
                <br />
                <button type="submit">Report Incident</button>
            </form>

            <h2>Recent Incidents</h2>
            {loading && <p>Loading incidents...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading && !error && incidents.length === 0 && (
                <p>No incidents reported yet. Be the first!</p>
            )}
            <div className="incident-list">
                {!loading && !error && incidents.map((incident) => (
                    <div key={incident._id} className="incident-item">
                        <p><strong>Description:</strong> {incident.description}</p>
                        <p><strong>Location:</strong> {incident.extractedLocation}</p>
                        <p><strong>Reported At:</strong> {new Date(incident.timestamp).toLocaleString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
