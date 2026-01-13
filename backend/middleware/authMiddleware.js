import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Auth middleware - reads JWT ONLY from HttpOnly cookies
// Does NOT expect Authorization headers (cookie-based auth only)
export const protect = async (req, res, next) => {
  try {
    // Read token from HttpOnly cookie (not from Authorization header)
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};
