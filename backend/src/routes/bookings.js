import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { getDatabase } from '../database/init.js';
import { protect, authorize } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
router.post('/', protect, [
  body('courtId').notEmpty().withMessage('Court ID is required'),
  body('date').isDate().withMessage('Valid date is required'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required (HH:MM)'),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required (HH:MM)'),
  body('duration').isInt({ min: 30, max: 480 }).withMessage('Duration must be between 30 and 480 minutes'),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { courtId, date, startTime, endTime, duration, notes } = req.body;
    const db = getDatabase();

    // Check if court exists and is active
    const court = await db.get(`
      SELECT c.*, v.name as venueName, v.location as venueLocation
      FROM courts c
      LEFT JOIN venues v ON c.venueId = v.id
      WHERE c.id = ? AND c.isActive = 1 AND v.isApproved = 1 AND v.isActive = 1
    `, [courtId]);

    if (!court) {
      return res.status(404).json({
        success: false,
        error: 'Court not found or not available'
      });
    }

    // Check if the time slot is available
    const conflictingBooking = await db.get(`
      SELECT * FROM bookings
      WHERE courtId = ? AND date = ? AND status IN ('confirmed', 'pending')
      AND (
        (startTime < ? AND endTime > ?) OR
        (startTime < ? AND endTime > ?) OR
        (startTime >= ? AND endTime <= ?)
      )
    `, [courtId, date, endTime, startTime, endTime, startTime, startTime, endTime]);

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        error: 'This time slot is already booked'
      });
    }

    // Calculate total amount
    const hours = duration / 60;
    const totalAmount = court.pricePerHour * hours;

    // Create booking
    const bookingId = uuidv4();
    await db.run(`
      INSERT INTO bookings (id, userId, courtId, date, startTime, endTime, duration, totalAmount, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [bookingId, req.user.id, courtId, date, startTime, endTime, duration, totalAmount, notes || null]);

    // Get created booking with venue details
    const booking = await db.get(`
      SELECT b.*, c.name as courtName, c.pricePerHour, v.name as venueName, v.location as venueLocation
      FROM bookings b
      LEFT JOIN courts c ON b.courtId = c.id
      LEFT JOIN venues v ON c.venueId = v.id
      WHERE b.id = ?
    `, [bookingId]);

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get user's bookings
// @route   GET /api/bookings
// @access  Private
router.get('/', protect, [
  query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed']),
  query('page').optional().isNumeric(),
  query('limit').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const db = getDatabase();
    const offset = (page - 1) * limit;

    let whereConditions = ['b.userId = ?'];
    let params = [req.user.id];

    if (status) {
      whereConditions.push('b.status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get bookings
    const bookings = await db.all(`
      SELECT b.*, c.name as courtName, v.name as venueName, v.location as venueLocation
      FROM bookings b
      LEFT JOIN courts c ON b.courtId = c.id
      LEFT JOIN venues v ON c.venueId = v.id
      WHERE ${whereClause}
      ORDER BY b.date DESC, b.startTime DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Get total count
    const countResult = await db.get(`
      SELECT COUNT(*) as total
      FROM bookings b
      WHERE ${whereClause}
    `, params);

    const total = countResult.total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const booking = await db.get(`
      SELECT b.*, c.name as courtName, c.pricePerHour, v.name as venueName, v.location as venueLocation
      FROM bookings b
      LEFT JOIN courts c ON b.courtId = c.id
      LEFT JOIN venues v ON c.venueId = v.id
      WHERE b.id = ? AND b.userId = ?
    `, [id, req.user.id]);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Check if booking exists and belongs to user
    const booking = await db.get('SELECT * FROM bookings WHERE id = ? AND userId = ?', [id, req.user.id]);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Booking is already cancelled'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel completed booking'
      });
    }

    // Check if booking is within cancellation window (e.g., 24 hours before)
    const bookingDate = new Date(booking.date + ' ' + booking.startTime);
    const now = new Date();
    const hoursUntilBooking = (bookingDate - now) / (1000 * 60 * 60);

    if (hoursUntilBooking < 24) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel booking within 24 hours of start time'
      });
    }

    // Cancel booking
    await db.run(`
      UPDATE bookings 
      SET status = 'cancelled', updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);

    const updatedBooking = await db.get(`
      SELECT b.*, c.name as courtName, v.name as venueName
      FROM bookings b
      LEFT JOIN courts c ON b.courtId = c.id
      LEFT JOIN venues v ON c.venueId = v.id
      WHERE b.id = ?
    `, [id]);

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update booking status (Owner/Admin only)
// @route   PUT /api/bookings/:id/status
// @access  Private (Owner/Admin)
router.put('/:id/status', protect, authorize('owner', 'admin'), [
  body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Valid status is required')
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
    const { status } = req.body;
    const db = getDatabase();

    // Check if booking exists
    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check if user has permission (owner of venue or admin)
    if (req.user.role !== 'admin') {
      const court = await db.get('SELECT venueId FROM courts WHERE id = ?', [booking.courtId]);
      const venue = await db.get('SELECT ownerId FROM venues WHERE id = ?', [court.venueId]);
      
      if (venue.ownerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this booking'
        });
      }
    }

    // Update booking status
    await db.run(`
      UPDATE bookings 
      SET status = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, id]);

    const updatedBooking = await db.get(`
      SELECT b.*, c.name as courtName, v.name as venueName
      FROM bookings b
      LEFT JOIN courts c ON b.courtId = c.id
      LEFT JOIN venues v ON c.venueId = v.id
      WHERE b.id = ?
    `, [id]);

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Booking status updated successfully'
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;
