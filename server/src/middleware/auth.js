import jwt from 'jsonwebtoken';
import User from '../models/User.js';
export const requireAuth = async (req, res, next) => {
  try {
    const { uid } = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    req.user = await User.findById(uid);
    if (!req.user) throw new Error();
    next();
  } catch { res.status(401).json({ error: 'Please log in to continue.' }); }
};
