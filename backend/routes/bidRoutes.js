import express from 'express';
import {
  createBid,
  getBidsByGig,
  getMyBids,
  hireFreelancer,
} from '../controllers/bidController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/my-bids', protect, getMyBids);
router.get('/:gigId', protect, getBidsByGig);
router.post('/', protect, createBid);
router.patch('/:bidId/hire', protect, hireFreelancer);

export default router;
