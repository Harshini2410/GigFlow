import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { store } from './store/store.js';
import './index.css';

// SPA ROUTING CONFIGURATION
// This app uses BrowserRouter for client-side routing
// The frontend MUST rely on index.html for all routes
// NO server-side routing assumptions exist
// Routing logic does NOT depend on window.location directly
// 
// IMPORTANT: For production (Render), you MUST configure:
// Render → Frontend → Redirects / Rewrites:
//   Source: /*
//   Destination: /index.html
//   Status: 200
// This ensures all routes serve index.html, allowing React Router to handle routing
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
