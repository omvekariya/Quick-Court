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
      SELECT bs.* FROM bookingSlots bs
      JOIN bookings b ON bs.bookingId = b.id
      WHERE b.courtId = ? AND b.date = ? AND b.status IN ('confirmed')
      AND (
        (bs.startTime < ? AND bs.endTime > ?) OR
        (bs.startTime < ? AND bs.endTime > ?) OR
        (bs.startTime >= ? AND bs.endTime <= ?)
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

    // Create booking (auto-confirm with paid status)
    const bookingId = uuidv4();
    await db.run(`
      INSERT INTO bookings (id, userId, courtId, date, totalAmount, status, paymentStatus, notes)
      VALUES (?, ?, ?, ?, ?, 'confirmed', 'paid', ?)
    `, [bookingId, req.user.id, courtId, date, totalAmount, notes || null]);

    // Create booking slot
    const slotId = uuidv4();
    await db.run(`
      INSERT INTO bookingSlots (id, bookingId, startTime, endTime, duration, slotAmount)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [slotId, bookingId, startTime, endTime, duration, totalAmount]);

    // Get created booking with venue details and slots
    const booking = await db.get(`
      SELECT b.*, 
             c.name as courtName, c.pricePerHour, 
             s.name as sportName,
             v.id as venueId, v.name as venueName, v.location as venueLocation
      FROM bookings b
      LEFT JOIN courts c ON b.courtId = c.id
      LEFT JOIN sports s ON c.sportId = s.id
      LEFT JOIN venues v ON c.venueId = v.id
      WHERE b.id = ?
    `, [bookingId]);

    // Get slots for this booking
    const slots = await db.all(`
      SELECT * FROM bookingSlots WHERE bookingId = ?
    `, [bookingId]);

    booking.slots = slots;

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

// @desc    Bulk create bookings for multiple slots
// @route   POST /api/bookings/bulk
// @access  Private
router.post('/bulk', protect, async (req, res) => {
  try {
    const { courtId, date, slots, notes } = req.body;
    if (!courtId || !date || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ success: false, error: 'courtId, date and slots[] are required' });
    }

    const db = getDatabase();

    // Validate court
    const court = await db.get(`
      SELECT c.*, v.isApproved, v.isActive
      FROM courts c JOIN venues v ON c.venueId = v.id
      WHERE c.id = ? AND c.isActive = 1 AND v.isApproved = 1 AND v.isActive = 1
    `, [courtId]);
    if (!court) {
      return res.status(404).json({ success: false, error: 'Court not found or not available' });
    }

    // Start transaction
    await db.run('BEGIN');

    // Calculate total amount for all slots
    let totalAmount = 0;
    const slotDetails = [];
    
    for (const s of slots) {
      const { startTime, endTime } = s;
      if (!startTime || !endTime) {
        await db.run('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Each slot requires startTime and endTime' });
      }

      // Check conflict
      const conflict = await db.get(`
        SELECT 1 FROM bookingSlots bs
        JOIN bookings b ON bs.bookingId = b.id
        WHERE b.courtId = ? AND b.date = ? AND b.status IN ('confirmed')
        AND (bs.startTime < ? AND bs.endTime > ?)
      `, [courtId, date, endTime, startTime]);
      if (conflict) {
        await db.run('ROLLBACK');
        return res.status(400).json({ success: false, error: `Slot ${startTime}-${endTime} is already booked` });
      }

      // Compute duration in minutes
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const duration = (eh * 60 + em) - (sh * 60 + sm);
      const slotAmount = court.pricePerHour * (duration / 60);
      totalAmount += slotAmount;
      
      slotDetails.push({ startTime, endTime, duration, slotAmount });
    }

    // Create single booking record
    const bookingId = uuidv4();
    await db.run(`
      INSERT INTO bookings (id, userId, courtId, date, totalAmount, status, paymentStatus, notes)
      VALUES (?, ?, ?, ?, ?, 'confirmed', 'paid', ?)
    `, [bookingId, req.user.id, courtId, date, totalAmount, notes || null]);

    // Create all booking slots
    for (const slot of slotDetails) {
      const slotId = uuidv4();
      await db.run(`
        INSERT INTO bookingSlots (id, bookingId, startTime, endTime, duration, slotAmount)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [slotId, bookingId, slot.startTime, slot.endTime, slot.duration, slot.slotAmount]);
    }

    // Get created booking with venue details and slots
    const booking = await db.get(`
      SELECT b.*, c.name as courtName, s.name as sportName, v.id as venueId, v.name as venueName, v.location as venueLocation
      FROM bookings b
      JOIN courts c ON b.courtId = c.id
      JOIN sports s ON c.sportId = s.id
      JOIN venues v ON c.venueId = v.id
      WHERE b.id = ?
    `, [bookingId]);

    // Get all slots for this booking
    const allSlots = await db.all(`
      SELECT * FROM bookingSlots WHERE bookingId = ?
    `, [bookingId]);

    booking.slots = allSlots;

    await db.run('COMMIT');
    return res.status(201).json({ success: true, data: booking });
  } catch (error) {
    try { await getDatabase().run('ROLLBACK'); } catch {}
    console.error('Bulk create bookings error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @desc    Get user's bookings
// @route   GET /api/bookings
// @access  Private
router.get('/', protect, [
  query('status').optional().isIn(['confirmed', 'cancelled', 'completed']),
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
      SELECT b.*, 
             c.name as courtName, c.pricePerHour,
             s.name as sportName,
             v.id as venueId, v.name as venueName, v.location as venueLocation
      FROM bookings b
      LEFT JOIN courts c ON b.courtId = c.id
      LEFT JOIN sports s ON c.sportId = s.id
      LEFT JOIN venues v ON c.venueId = v.id
      WHERE ${whereClause}
      ORDER BY b.date DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Get slots for each booking
    for (const booking of bookings) {
      const slots = await db.all(`
        SELECT * FROM bookingSlots WHERE bookingId = ? ORDER BY startTime
      `, [booking.id]);
      booking.slots = slots;
    }

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
      SELECT b.*, 
             c.name as courtName, c.pricePerHour,
             s.name as sportName,
             v.id as venueId, v.name as venueName, v.location as venueLocation
      FROM bookings b
      LEFT JOIN courts c ON b.courtId = c.id
      LEFT JOIN sports s ON c.sportId = s.id
      LEFT JOIN venues v ON c.venueId = v.id
      WHERE b.id = ? AND b.userId = ?
    `, [id, req.user.id]);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Get slots for this booking
    const slots = await db.all(`
      SELECT * FROM bookingSlots WHERE bookingId = ? ORDER BY startTime
    `, [id]);
    booking.slots = slots;

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
      SELECT b.*, 
             c.name as courtName, c.pricePerHour,
             s.name as sportName,
             v.id as venueId, v.name as venueName
      FROM bookings b
      LEFT JOIN courts c ON b.courtId = c.id
      LEFT JOIN sports s ON c.sportId = s.id
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
  body('status').isIn(['confirmed', 'cancelled', 'completed']).withMessage('Valid status is required')
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
      SELECT b.*, 
             c.name as courtName, c.pricePerHour,
             s.name as sportName,
             v.id as venueId, v.name as venueName
      FROM bookings b
      LEFT JOIN courts c ON b.courtId = c.id
      LEFT JOIN sports s ON c.sportId = s.id
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
