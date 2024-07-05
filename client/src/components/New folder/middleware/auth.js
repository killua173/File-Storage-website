const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ msg: 'Authorization denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ msg: 'Authorization denied. Invalid token.' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Authorization denied. Token is not valid.' });
  }
};

module.exports = authMiddleware;
