import Message from '../models/Message.js';
import Gig from '../models/Gig.js';
import Bid from '../models/Bid.js';

// Helper function to check if user has access to gig chat
// Access is granted ONLY if:
// - User is the gig owner
// - OR user is the hired freelancer (bid with status 'hired')
const checkChatAccess = async (gigId, userId) => {
  const gig = await Gig.findById(gigId);
  if (!gig) {
    return { hasAccess: false, error: 'Gig not found' };
  }

  // Check if gig is assigned (chat only available for assigned gigs)
  if (gig.status !== 'assigned') {
    return { hasAccess: false, error: 'Chat is only available for assigned gigs' };
  }

  // Check if user is the owner
  if (gig.ownerId.toString() === userId.toString()) {
    return { hasAccess: true, gig };
  }

  // Check if user is the hired freelancer
  const hiredBid = await Bid.findOne({
    gigId,
    freelancerId: userId,
    status: 'hired',
  });

  if (hiredBid) {
    return { hasAccess: true, gig };
  }

  return { hasAccess: false, error: 'Not authorized to access this chat' };
};

// @desc    Get all messages for a gig
// @route   GET /api/messages/:gigId
// @access  Private (Owner or hired freelancer only)
export const getMessages = async (req, res, next) => {
  try {
    const { gigId } = req.params;

    // Check access control
    const { hasAccess, error } = await checkChatAccess(gigId, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: error });
    }

    // Get all messages for this gig, sorted oldest to newest
    const messages = await Message.find({ gigId })
      .populate('sender', 'name email')
      .populate('readBy', 'name')
      .sort({ createdAt: 1 }); // Oldest first

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a message
// @route   POST /api/messages/:gigId
// @access  Private (Owner or hired freelancer only)
export const createMessage = async (req, res, next) => {
  try {
    const { gigId } = req.params;
    const { content, type = 'text', fileUrl } = req.body;

    // Check access control
    const { hasAccess, error, gig } = await checkChatAccess(gigId, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: error });
    }

    // Validate message content based on type
    if (type === 'text') {
      if (!content || !content.trim()) {
        return res.status(400).json({ message: 'Message content is required' });
      }
    } else if (type === 'file') {
      if (!fileUrl || !fileUrl.trim()) {
        return res.status(400).json({ message: 'File URL is required' });
      }

      // Validate URL format (must be HTTPS)
      try {
        const url = new URL(fileUrl);
        if (url.protocol !== 'https:') {
          return res.status(400).json({ message: 'File URL must use HTTPS' });
        }
        if (fileUrl.length > 2048) {
          return res.status(400).json({ message: 'File URL is too long (max 2048 characters)' });
        }
      } catch (urlError) {
        return res.status(400).json({ message: 'Invalid URL format' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid message type' });
    }

    // Create message
    const message = await Message.create({
      gigId,
      sender: req.user._id,
      content: type === 'text' ? content.trim() : undefined,
      type,
      fileUrl: type === 'file' ? fileUrl.trim() : undefined,
      readBy: [req.user._id], // Sender has read their own message
    });

    // Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email')
      .populate('readBy', 'name');

    // Emit Socket.io event to gig room
    const io = req.app.get('io');
    io.to(`gig_${gigId}`).emit('new_message', populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark message as read
// @route   PATCH /api/messages/:messageId/read
// @access  Private
export const markMessageAsRead = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check access control
    const { hasAccess, error } = await checkChatAccess(message.gigId, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: error });
    }

    // Add user to readBy array if not already present
    if (!message.readBy.includes(req.user._id)) {
      message.readBy.push(req.user._id);
      await message.save();
    }

    // Emit read receipt to gig room
    const io = req.app.get('io');
    io.to(`gig_${message.gigId}`).emit('message_read', {
      gigId: message.gigId.toString(),
      messageId: message._id.toString(),
      readBy: req.user._id.toString(),
    });

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    next(error);
  }
};

