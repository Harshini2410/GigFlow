import Gig from '../models/Gig.js';

// @desc    Get all open gigs (with optional search)
// @route   GET /api/gigs
// @access  Public
export const getGigs = async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = { status: 'open' };

    if (search) {
      query.$text = { $search: search };
    }

    const gigs = await Gig.find(query)
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 });

    res.json(gigs);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single gig
// @route   GET /api/gigs/:id
// @access  Public
export const getGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id).populate('ownerId', 'name email');

    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    res.json(gig);
  } catch (error) {
    next(error);
  }
};

// @desc    Create gig
// @route   POST /api/gigs
// @access  Private
export const createGig = async (req, res, next) => {
  try {
    const { title, description, budget } = req.body;

    if (!title || !description || !budget) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    const gig = await Gig.create({
      title,
      description,
      budget,
      ownerId: req.user._id,
    });

    const populatedGig = await Gig.findById(gig._id).populate('ownerId', 'name email');

    res.status(201).json(populatedGig);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's gigs
// @route   GET /api/gigs/my-gigs
// @access  Private
export const getMyGigs = async (req, res, next) => {
  try {
    const gigs = await Gig.find({ ownerId: req.user._id })
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 });

    res.json(gigs);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete gig
// @route   DELETE /api/gigs/:id
// @access  Private (Owner only)
export const deleteGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    // Check if user is the owner
    if (gig.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this gig' });
    }

    // Delete the gig (MongoDB will handle related bids via cascade if configured)
    await Gig.findByIdAndDelete(req.params.id);

    res.json({ message: 'Gig deleted successfully' });
  } catch (error) {
    next(error);
  }
};
