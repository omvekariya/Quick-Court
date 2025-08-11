import express from 'express';
import { getDatabase } from '../database/init.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all notifications for user
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const db = getDatabase();
    
    const notifications = await db.all(`
      SELECT * FROM notifications 
      WHERE userId = ? 
      ORDER BY createdAt DESC
    `, [req.user.id]);

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    // Check if notification exists and belongs to user
    const notification = await db.get('SELECT * FROM notifications WHERE id = ? AND userId = ?', [id, req.user.id]);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    await db.run('UPDATE notifications SET isRead = 1 WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    const db = getDatabase();
    
    await db.run('UPDATE notifications SET isRead = 1 WHERE userId = ?', [req.user.id]);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    // Check if notification exists and belongs to user
    const notification = await db.get('SELECT * FROM notifications WHERE id = ? AND userId = ?', [id, req.user.id]);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    await db.run('DELETE FROM notifications WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;
