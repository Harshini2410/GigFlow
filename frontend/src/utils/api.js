import axios from 'axios';

// Centralized Axios instance for all API calls
// withCredentials: true ensures cookies are sent with every request (required for HttpOnly cookies)
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`,
  withCredentials: true, // CRITICAL: Must be true for cookie-based auth
});

export default api;
