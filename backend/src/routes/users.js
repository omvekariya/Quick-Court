import express from 'express';
import { getDatabase } from '../database/init.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const db = getDatabase();
    const user = await db.get('SELECT id, email, fullName, phone, role, isVerified, profileImage, createdAt FROM users WHERE id = ?', [req.user.id]);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;
