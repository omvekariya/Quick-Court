import express from 'express';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../database/init.js';
import { protect } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// @desc    Get reviews for a venue
// @route   GET /api/venues/:venueId/reviews
// @access  Public
router.get('/:venueId/reviews', async (req, res) => {
  try {
    const { venueId } = req.params;
    const db = getDatabase();
    
    const reviews = await db.all(`
      SELECT r.*, u.fullName, u.profileImage
      FROM reviews r
      JOIN users u ON r.userId = u.id
      WHERE r.venueId = ? AND r.isActive = 1
      ORDER BY r.createdAt DESC
    `, [venueId]);

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
router.post('/', protect, [
  body('venueId').notEmpty().withMessage('Venue ID is required'),
  body('bookingId').notEmpty().withMessage('Booking ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { venueId, bookingId, rating, comment } = req.body;
    const db = getDatabase();

    // Check if booking exists and belongs to user
    const booking = await db.get('SELECT * FROM bookings WHERE id = ? AND userId = ?', [bookingId, req.user.id]);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check if user has already reviewed this booking
    const existingReview = await db.get('SELECT * FROM reviews WHERE bookingId = ?', [bookingId]);
    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'You have already reviewed this booking'
      });
    }

    const reviewId = uuidv4();
    
    await db.run(`
      INSERT INTO reviews (id, venueId, bookingId, userId, rating, comment, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [reviewId, venueId, bookingId, req.user.id, rating, comment]);

    // Update venue rating
    const venueReviews = await db.all('SELECT rating FROM reviews WHERE venueId = ? AND isActive = 1', [venueId]);
    const avgRating = venueReviews.reduce((sum, review) => sum + review.rating, 0) / venueReviews.length;
    
    await db.run('UPDATE venues SET rating = ? WHERE id = ?', [avgRating, venueId]);

    const newReview = await db.get(`
      SELECT r.*, u.fullName, u.profileImage
      FROM reviews r
      JOIN users u ON r.userId = u.id
      WHERE r.id = ?
    `, [reviewId]);

    res.status(201).json({
      success: true,
      data: newReview
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private (Review owner)
router.put('/:id', protect, [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { id } = req.params;
    const { rating, comment } = req.body;
    const db = getDatabase();

    // Check if review exists and belongs to user
    const review = await db.get('SELECT * FROM reviews WHERE id = ? AND userId = ?', [id, req.user.id]);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    const updateFields = [];
    const updateValues = [];

    if (rating !== undefined) {
      updateFields.push('rating = ?');
      updateValues.push(rating);
    }

    if (comment !== undefined) {
      updateFields.push('comment = ?');
      updateValues.push(comment);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    updateFields.push('updatedAt = CURRENT_TIMESTAMP');
    updateValues.push(id);

    await db.run(`
      UPDATE reviews 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    // Update venue rating
    const venueReviews = await db.all('SELECT rating FROM reviews WHERE venueId = ? AND isActive = 1', [review.venueId]);
    const avgRating = venueReviews.reduce((sum, r) => sum + r.rating, 0) / venueReviews.length;
    
    await db.run('UPDATE venues SET rating = ? WHERE id = ?', [avgRating, review.venueId]);

    const updatedReview = await db.get(`
      SELECT r.*, u.fullName, u.profileImage
      FROM reviews r
      JOIN users u ON r.userId = u.id
      WHERE r.id = ?
    `, [id]);

    res.json({
      success: true,
      data: updatedReview
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (Review owner)
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Check if review exists and belongs to user
    const review = await db.get('SELECT * FROM reviews WHERE id = ? AND userId = ?', [id, req.user.id]);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    await db.run('UPDATE reviews SET isActive = 0 WHERE id = ?', [id]);

    // Update venue rating
    const venueReviews = await db.all('SELECT rating FROM reviews WHERE venueId = ? AND isActive = 1', [review.venueId]);
    const avgRating = venueReviews.length > 0 
      ? venueReviews.reduce((sum, r) => sum + r.rating, 0) / venueReviews.length 
      : 0;
    
    await db.run('UPDATE venues SET rating = ? WHERE id = ?', [avgRating, review.venueId]);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;
