import { io } from 'socket.io-client';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socketUrl = apiUrl.replace('/api', '') || 'http://localhost:5000';

const socket = io(socketUrl, {
  withCredentials: true,
});

export default socket;
