import express from 'express';
import {
  getMessages,
  createMessage,
  markMessageAsRead,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All message routes require authentication
router.get('/:gigId', protect, getMessages);
router.post('/:gigId', protect, createMessage);
router.patch('/:messageId/read', protect, markMessageAsRead);

export default router;

