import express from 'express';
import {
  getGigs,
  getGig,
  createGig,
  getMyGigs,
} from '../controllers/gigController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getGigs);
router.get('/my-gigs', protect, getMyGigs);
router.get('/:id', getGig);
router.post('/', protect, createGig);

export default router;
