import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import gigRoutes from './routes/gigRoutes.js';
import bidRoutes from './routes/bidRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { socketAuth } from './middleware/socketAuth.js';
import Gig from './models/Gig.js';
import Bid from './models/Bid.js';
import Message from './models/Message.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});

// Middleware
// CORS configuration MUST come before routes and MUST include credentials: true
// This allows cookies to be sent cross-origin (required for Render deployment)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // CRITICAL: Must be true for cookie-based auth
}));
app.use(express.json());
app.use(cookieParser()); // Required to parse HttpOnly cookies

// Socket.io authentication middleware
// Verifies user on connection using JWT from cookies
io.use(socketAuth);

// Socket.io connection handling
io.on('connection', (socket) => {
  const userId = socket.data.userId;
  const userName = socket.data.user?.name || 'Unknown';
  console.log(`User connected: ${userName} (${userId}) - Socket: ${socket.id}`);

  // Handle room joining for user notifications (existing)
  socket.on('join', (room) => {
    socket.join(room);
    console.log(`User ${userName} joined room: ${room}`);
  });

  socket.on('leave', (room) => {
    socket.leave(room);
    console.log(`User ${userName} left room: ${room}`);
  });

  // Chat: Join gig room (with authorization check)
  socket.on('join_gig_room', async (data) => {
    try {
      const { gigId } = data;
      if (!gigId) {
        socket.emit('error', { message: 'Gig ID is required' });
        return;
      }

      // Check if user has access to this gig chat
      const gig = await Gig.findById(gigId);
      if (!gig) {
        socket.emit('error', { message: 'Gig not found' });
        return;
      }

      // Chat only available for assigned gigs
      if (gig.status !== 'assigned') {
        socket.emit('error', { message: 'Chat is only available for assigned gigs' });
        return;
      }

      // Check if user is owner
      const isOwner = gig.ownerId.toString() === userId;

      // Check if user is hired freelancer
      const hiredBid = await Bid.findOne({
        gigId,
        freelancerId: userId,
        status: 'hired',
      });

      if (!isOwner && !hiredBid) {
        socket.emit('error', { message: 'Not authorized to access this chat' });
        return;
      }

      // User has access - join the room
      const roomName = `gig_${gigId}`;
      socket.join(roomName);
      console.log(`User ${userName} joined chat room: ${roomName}`);

      socket.emit('joined_gig_room', { gigId });
    } catch (error) {
      console.error('Error joining gig room:', error);
      socket.emit('error', { message: 'Failed to join chat room' });
    }
  });

  // Chat: Leave gig room
  socket.on('leave_gig_room', (data) => {
    const { gigId } = data;
    if (gigId) {
      const roomName = `gig_${gigId}`;
      socket.leave(roomName);
      console.log(`User ${userName} left chat room: ${roomName}`);
    }
  });

  // Chat: Typing indicator
  socket.on('typing', async (data) => {
    try {
      const { gigId } = data;
      if (!gigId) return;

      // Verify user has access to this gig
      const gig = await Gig.findById(gigId);
      if (!gig || gig.status !== 'assigned') return;

      const isOwner = gig.ownerId.toString() === userId;
      const hiredBid = await Bid.findOne({
        gigId,
        freelancerId: userId,
        status: 'hired',
      });

      if (!isOwner && !hiredBid) return;

      // Broadcast typing to other participant only (not to sender)
      const roomName = `gig_${gigId}`;
      socket.to(roomName).emit('user_typing', {
        gigId,
        userId,
        userName: socket.data.user?.name,
      });
    } catch (error) {
      console.error('Error handling typing:', error);
    }
  });

  // Chat: Stop typing indicator
  socket.on('stop_typing', (data) => {
    const { gigId } = data;
    if (gigId) {
      const roomName = `gig_${gigId}`;
      socket.to(roomName).emit('user_stopped_typing', {
        gigId,
        userId,
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User ${userName} disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'GigFlow API is running' });
});

// Error handling middleware
app.use(errorHandler);

// Database connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gigflow')
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
