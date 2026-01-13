import Bid from '../models/Bid.js';
import Gig from '../models/Gig.js';
import mongoose from 'mongoose';

// @desc    Create bid
// @route   POST /api/bids
// @access  Private
export const createBid = async (req, res, next) => {
  try {
    const { gigId, message, price } = req.body;

    if (!gigId || !message || price === undefined) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    // Validate price
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ message: 'Price must be a valid number greater than 0' });
    }

    // Check if gig exists and is open
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    if (gig.status !== 'open') {
      return res.status(400).json({ message: 'Gig is no longer open for bids' });
    }

    // Prevent owner from bidding on own gig
    if (gig.ownerId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot bid on your own gig' });
    }

    // Check if user already bid on this gig
    const existingBid = await Bid.findOne({ gigId, freelancerId: req.user._id });
    if (existingBid) {
      return res.status(400).json({ message: 'You have already bid on this gig' });
    }

    const bid = await Bid.create({
      gigId,
      freelancerId: req.user._id,
      message,
      price,
    });

    const populatedBid = await Bid.findById(bid._id)
      .populate('freelancerId', 'name email')
      .populate('gigId', 'title');

    res.status(201).json(populatedBid);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already bid on this gig' });
    }
    next(error);
  }
};

// @desc    Get bids for a gig (owner only)
// @route   GET /api/bids/:gigId
// @access  Private
export const getBidsByGig = async (req, res, next) => {
  try {
    const { gigId } = req.params;

    // Check if gig exists and user is owner
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    if (gig.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view these bids' });
    }

    const bids = await Bid.find({ gigId })
      .populate('freelancerId', 'name email')
      .sort({ createdAt: -1 });

    res.json(bids);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's bids
// @route   GET /api/bids/my-bids
// @access  Private
export const getMyBids = async (req, res, next) => {
  try {
    const bids = await Bid.find({ freelancerId: req.user._id })
      .populate('gigId', 'title description budget status ownerId')
      .populate('freelancerId', 'name email')
      .sort({ createdAt: -1 });

    res.json(bids);
  } catch (error) {
    next(error);
  }
};

// @desc    Hire a freelancer (atomic operation with transaction)
// @route   PATCH /api/bids/:bidId/hire
// @access  Private
export const hireFreelancer = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bidId } = req.params;

    // Find the bid with gig populated
    const bid = await Bid.findById(bidId)
      .populate('gigId')
      .session(session);

    if (!bid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Bid not found' });
    }

    const gig = bid.gigId;

    // Check if user is the gig owner
    if (gig.ownerId.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Not authorized to hire for this gig' });
    }

    // Check if gig is still open
    if (gig.status !== 'open') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Gig is no longer open' });
    }

    // Check if bid is pending
    if (bid.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Bid is not pending' });
    }

    // Atomic update: Change gig status, mark selected bid as hired, reject all other bids
    // Use findOneAndUpdate with session for atomicity
    const updatedGig = await Gig.findOneAndUpdate(
      { _id: gig._id, status: 'open' }, // Only update if still open (prevents race condition)
      { status: 'assigned' },
      { new: true, session }
    );

    if (!updatedGig) {
      // Another transaction already changed the status
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ message: 'Gig was already assigned' });
    }

    // Mark selected bid as hired
    await Bid.findByIdAndUpdate(bidId, { status: 'hired' }, { session });

    // Mark all other bids as rejected
    await Bid.updateMany(
      { gigId: gig._id, _id: { $ne: bidId }, status: 'pending' },
      { status: 'rejected' },
      { session }
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Get updated bid with populated fields
    const updatedBid = await Bid.findById(bidId)
      .populate('freelancerId', 'name email')
      .populate('gigId', 'title');

    // Emit Socket.io event for real-time notification
    const io = req.app.get('io');
    const freelancerId = bid.freelancerId.toString();
    io.to(`user_${freelancerId}`).emit('hired', {
      message: `You have been hired for ${gig.title}!`,
      gigId: gig._id.toString(),
      gigTitle: gig.title,
      bidId: bid._id.toString(),
    });

    res.json({
      message: 'Freelancer hired successfully',
      bid: updatedBid,
      gig: updatedGig,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
