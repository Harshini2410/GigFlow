import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import cookieParser from 'cookie-parser';

// Socket.io authentication middleware
// Verifies JWT token from handshake cookies
// Attaches user to socket.data for use in event handlers
export const socketAuth = async (socket, next) => {
  try {
    // Parse cookies from handshake headers
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) {
      return next(new Error('Authentication error: No cookies provided'));
    }

    // Extract token from cookies (format: "token=value; other=value")
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        acc[key] = decodeURIComponent(value);
      }
      return acc;
    }, {});

    const token = cookies.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user to socket for use in event handlers
    socket.data.user = user;
    socket.data.userId = user._id.toString();
    next();
  } catch (error) {
    if (error.message.includes('Authentication error')) {
      return next(error);
    }
    return next(new Error('Authentication error: Invalid token'));
  }
};

