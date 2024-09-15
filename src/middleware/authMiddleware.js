const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authMiddleware = async (req, res, next) => {
  try {
    // Check for the token in the Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user by id and token
    const user = await User.findOne({ _id: decoded.id, 'tokens.token': token }).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    // Check if the token has expired
    if (Date.now() >= decoded.exp * 1000) {
      throw new Error('Token has expired');
    }

    // Attach the user and token to the request object
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.message === 'User not found') {
      return res.status(401).json({ message: 'User not found or token invalidated' });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = authMiddleware;
