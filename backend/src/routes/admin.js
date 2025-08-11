import express from 'express';
import { getDatabase } from '../database/init.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin role
router.use(protect, authorize('admin'));

// @desc    Get pending venue approvals
// @route   GET /api/admin/venues/pending
// @access  Private (Admin)
router.get('/venues/pending', async (req, res) => {
  try {
    const db = getDatabase();
    const venues = await db.all(`
      SELECT v.*, u.fullName as ownerName, u.email as ownerEmail
      FROM venues v
      LEFT JOIN users u ON v.ownerId = u.id
      WHERE v.isApproved = 0 AND v.isActive = 1
      ORDER BY v.createdAt DESC
    `);

    res.json({
      success: true,
      data: venues
    });
  } catch (error) {
    console.error('Get pending venues error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Approve/reject venue
// @route   PUT /api/admin/venues/:id/approve
// @access  Private (Admin)
router.put('/venues/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, feedback } = req.body;
    const db = getDatabase();

    console.log(`Admin approval request: venue=${id}, approved=${approved}, feedback=${feedback}`);

    // Check if venue exists
    const venue = await db.get('SELECT * FROM venues WHERE id = ?', [id]);
    if (!venue) {
      console.log(`Venue not found: ${id}`);
      return res.status(404).json({
        success: false,
        error: 'Venue not found'
      });
    }

    console.log(`Found venue: ${venue.name}, current isApproved: ${venue.isApproved}`);

    await db.run(`
      UPDATE venues 
      SET isApproved = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [approved ? 1 : 0, id]);

    console.log(`Updated venue ${id} isApproved to: ${approved ? 1 : 0}`);

    // If venue is rejected and feedback is provided, you could store it in a separate table
    // For now, we'll just log it or you could add a feedback field to venues table
    if (!approved && feedback) {
      console.log(`Venue ${id} rejected with feedback: ${feedback}`);
      // TODO: Store feedback in database if needed
    }

    res.json({
      success: true,
      message: `Venue ${approved ? 'approved' : 'rejected'} successfully`
    });
  } catch (error) {
    console.error('Approve venue error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
router.get('/users', async (req, res) => {
  try {
    const db = getDatabase();
    const users = await db.all(`
      SELECT id, email, fullName, phone, role, isVerified, isActive, createdAt
      FROM users
      ORDER BY createdAt DESC
    `);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;
