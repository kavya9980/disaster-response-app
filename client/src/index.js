// client/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css'; // You can keep the default or remove if not used
import App from './App';
import reportWebVitals from './reportWebVitals'; // Keep if you want performance metrics

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
