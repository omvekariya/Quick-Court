import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { getDatabase } from '../database/init.js';
import jwt from 'jsonwebtoken';
import { protect, authorize } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// @desc    Get all venues
// @route   GET /api/venues
// @access  Public
router.get('/', [
  query('sport').optional().isString(),
  query('location').optional().isString(),
  query('minPrice').optional().isNumeric(),
  query('maxPrice').optional().isNumeric(),
  query('rating').optional().isNumeric(),
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

    const { sport, location, minPrice, maxPrice, rating, page = 1, limit = 10 } = req.query;
    const db = getDatabase();
    const offset = (page - 1) * limit;

    let whereConditions = ['v.isApproved = 1 AND v.isActive = 1'];
    let params = [];

    if (sport) {
      whereConditions.push('s.name LIKE ?');
      params.push(`%${sport}%`);
    }

    if (location) {
      whereConditions.push('v.location LIKE ?');
      params.push(`%${location}%`);
    }

    if (minPrice) {
      whereConditions.push('c.pricePerHour >= ?');
      params.push(minPrice);
    }

    if (maxPrice) {
      whereConditions.push('c.pricePerHour <= ?');
      params.push(maxPrice);
    }

    if (rating) {
      whereConditions.push('v.rating >= ?');
      params.push(rating);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get venues with courts and sports
    const venues = await db.all(`
      SELECT DISTINCT 
        v.*,
        u.fullName as ownerName,
        GROUP_CONCAT(DISTINCT s.name) as sportTypes,
        GROUP_CONCAT(DISTINCT c.id) as courtIds,
        GROUP_CONCAT(DISTINCT c.name) as courtNames,
        MIN(c.pricePerHour) as minPrice,
        MAX(c.pricePerHour) as maxPrice
      FROM venues v
      LEFT JOIN users u ON v.ownerId = u.id
      LEFT JOIN courts c ON v.id = c.venueId AND c.isActive = 1
      LEFT JOIN sports s ON c.sportId = s.id
      WHERE ${whereClause}
      GROUP BY v.id
      ORDER BY v.rating DESC, v.createdAt DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Get total count
    const countResult = await db.get(`
      SELECT COUNT(DISTINCT v.id) as total
      FROM venues v
      LEFT JOIN courts c ON v.id = c.venueId AND c.isActive = 1
      LEFT JOIN sports s ON c.sportId = s.id
      WHERE ${whereClause}
    `, params);

    const total = countResult.total;
    const totalPages = Math.ceil(total / limit);

    // Parse JSON fields
    const formattedVenues = venues.map(venue => ({
      ...venue,
      images: venue.images ? JSON.parse(venue.images) : [],
      amenities: venue.amenities ? JSON.parse(venue.amenities) : [],
      openingHours: venue.openingHours ? JSON.parse(venue.openingHours) : {},
      sportTypes: venue.sportTypes ? venue.sportTypes.split(',') : [],
      courtIds: venue.courtIds ? venue.courtIds.split(',') : [],
      courtNames: venue.courtNames ? venue.courtNames.split(',') : []
    }));

    res.json({
      success: true,
      data: formattedVenues,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Get venues error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Create court for a venue
// @route   POST /api/venues/:venueId/courts
// @access  Private (Owner/Admin)
router.post('/:venueId/courts', protect, authorize('owner', 'admin'), [
  body('name').notEmpty().withMessage('Court name is required'),
  body('sportId').notEmpty().withMessage('Sport is required'),
  body('pricePerHour').isFloat({ gt: 0 }).withMessage('Valid pricePerHour is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { venueId } = req.params;
    const { name, sportId, description = '', pricePerHour } = req.body;
    const db = getDatabase();

    // Ensure venue exists and belongs to requester (unless admin)
    const venue = await db.get('SELECT * FROM venues WHERE id = ?', [venueId]);
    if (!venue) return res.status(404).json({ success: false, error: 'Venue not found' });
    if (req.user.role !== 'admin' && venue.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to add courts to this venue' });
    }

    const courtId = uuidv4();
    await db.run(`
      INSERT INTO courts (id, venueId, name, sportId, description, pricePerHour, isActive)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `, [courtId, venueId, name, sportId, description, pricePerHour]);

    const court = await db.get(`
      SELECT c.*, s.name as sportName, s.icon as sportIcon
      FROM courts c LEFT JOIN sports s ON c.sportId = s.id
      WHERE c.id = ?
    `, [courtId]);

    res.status(201).json({ success: true, data: court });
  } catch (error) {
    console.error('Create court error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @desc    Update court
// @route   PUT /api/venues/:venueId/courts/:courtId
// @access  Private (Owner/Admin)
router.put('/:venueId/courts/:courtId', protect, authorize('owner', 'admin'), async (req, res) => {
  try {
    const { venueId, courtId } = req.params;
    const { name, sportId, description, pricePerHour, isActive } = req.body;
    const db = getDatabase();

    const venue = await db.get('SELECT * FROM venues WHERE id = ?', [venueId]);
    if (!venue) return res.status(404).json({ success: false, error: 'Venue not found' });
    if (req.user.role !== 'admin' && venue.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to update courts for this venue' });
    }

    const court = await db.get('SELECT * FROM courts WHERE id = ? AND venueId = ?', [courtId, venueId]);
    if (!court) return res.status(404).json({ success: false, error: 'Court not found' });

    const updates = [];
    const values = [];
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (sportId !== undefined) { updates.push('sportId = ?'); values.push(sportId); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (pricePerHour !== undefined) { updates.push('pricePerHour = ?'); values.push(pricePerHour); }
    if (isActive !== undefined) { updates.push('isActive = ?'); values.push(isActive ? 1 : 0); }
    updates.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(courtId);

    await db.run(`UPDATE courts SET ${updates.join(', ')} WHERE id = ?`, values);

    const updated = await db.get(`
      SELECT c.*, s.name as sportName, s.icon as sportIcon
      FROM courts c LEFT JOIN sports s ON c.sportId = s.id
      WHERE c.id = ?
    `, [courtId]);

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update court error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @desc    Delete court
// @route   DELETE /api/venues/:venueId/courts/:courtId
// @access  Private (Owner/Admin)
router.delete('/:venueId/courts/:courtId', protect, authorize('owner', 'admin'), async (req, res) => {
  try {
    const { venueId, courtId } = req.params;
    const db = getDatabase();

    const venue = await db.get('SELECT * FROM venues WHERE id = ?', [venueId]);
    if (!venue) return res.status(404).json({ success: false, error: 'Venue not found' });
    if (req.user.role !== 'admin' && venue.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete courts for this venue' });
    }

    const court = await db.get('SELECT * FROM courts WHERE id = ? AND venueId = ?', [courtId, venueId]);
    if (!court) return res.status(404).json({ success: false, error: 'Court not found' });

    await db.run('DELETE FROM courts WHERE id = ?', [courtId]);
    res.json({ success: true, message: 'Court deleted successfully' });
  } catch (error) {
    console.error('Delete court error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});
// @desc    Get single venue
// @route   GET /api/venues/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    console.log(`Venue details request for ID: ${id}`);

    // Optionally decode auth to allow owner/admin to view unapproved venues
    let requester = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        requester = { id: decoded.id, role: decoded.role };
        console.log(`Authenticated user: ${requester.role} (${requester.id})`);
      } catch (e) {
        console.log('Invalid token, treating as public access');
        // ignore invalid token for public access
      }
    } else {
      console.log('No auth header, treating as public access');
    }

    // Build approval visibility condition
    let visibilityCondition;
    let visibilityParams = [];
    
    if (requester && requester.role === 'admin') {
      // Admin can view any venue
      visibilityCondition = '1=1';
    } else if (requester) {
      // Owner can view their own venues or approved venues
      visibilityCondition = '(v.isApproved = 1 OR v.ownerId = ?)';
      visibilityParams = [requester.id];
    } else {
      // Public users can only view approved venues
      visibilityCondition = 'v.isApproved = 1';
    }

    // Get venue details
    console.log(`Query condition: ${visibilityCondition}, params: [${id}, ${visibilityParams.join(', ')}]`);
    
    // First, let's check if the venue exists at all
    const venueExists = await db.get('SELECT id, name, isApproved, isActive FROM venues WHERE id = ?', [id]);
    console.log(`Venue exists check:`, venueExists);
    
    const venue = await db.get(`
      SELECT v.*, u.fullName as ownerName
      FROM venues v
      LEFT JOIN users u ON v.ownerId = u.id
      WHERE v.id = ? AND v.isActive = 1 AND ${visibilityCondition}
    `, [id, ...visibilityParams]);

    if (!venue) {
      console.log(`Venue not found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        error: 'Venue not found'
      });
    }

    console.log(`Found venue: ${venue.name}, isApproved: ${venue.isApproved}, isActive: ${venue.isActive}`);

    // Get courts for this venue
    const courts = await db.all(`
      SELECT c.*, s.name as sportName, s.icon as sportIcon
      FROM courts c
      LEFT JOIN sports s ON c.sportId = s.id
      WHERE c.venueId = ? AND c.isActive = 1
      ORDER BY c.name
    `, [id]);

    // Get reviews for this venue
    const reviews = await db.all(`
      SELECT r.*, u.fullName as userName
      FROM reviews r
      LEFT JOIN users u ON r.userId = u.id
      WHERE r.venueId = ? AND r.isVerified = 1
      ORDER BY r.createdAt DESC
      LIMIT 10
    `, [id]);

    // Parse JSON fields
    venue.images = venue.images ? JSON.parse(venue.images) : [];
    venue.amenities = venue.amenities ? JSON.parse(venue.amenities) : [];
    venue.openingHours = venue.openingHours ? JSON.parse(venue.openingHours) : {};

    res.json({
      success: true,
      data: {
        venue,
        courts,
        reviews
      }
    });
  } catch (error) {
    console.error('Get venue error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Create venue (Owner only)
// @route   POST /api/venues
// @access  Private (Owner)
router.post('/', protect, authorize('owner', 'admin'), [
  body('name').notEmpty().withMessage('Venue name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('images').optional().isArray(),
  body('amenities').optional().isArray(),
  body('openingHours').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { name, description, location, address, latitude, longitude, images, amenities, openingHours } = req.body;
    const db = getDatabase();

    const venueId = uuidv4();
    await db.run(`
      INSERT INTO venues (id, name, description, location, address, latitude, longitude, ownerId, images, amenities, openingHours)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      venueId,
      name,
      description,
      location,
      address,
      latitude || null,
      longitude || null,
      req.user.id,
      images ? JSON.stringify(images) : null,
      amenities ? JSON.stringify(amenities) : null,
      openingHours ? JSON.stringify(openingHours) : null
    ]);

    const venue = await db.get('SELECT * FROM venues WHERE id = ?', [venueId]);

    res.status(201).json({
      success: true,
      data: venue
    });
  } catch (error) {
    console.error('Create venue error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update venue
// @route   PUT /api/venues/:id
// @access  Private (Owner/Admin)
router.put('/:id', protect, authorize('owner', 'admin'), [
  body('name').optional().notEmpty().withMessage('Venue name cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('location').optional().notEmpty().withMessage('Location cannot be empty'),
  body('address').optional().notEmpty().withMessage('Address cannot be empty'),
  body('images').optional().isArray(),
  body('amenities').optional().isArray(),
  body('openingHours').optional().isObject()
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
    const { name, description, location, address, latitude, longitude, images, amenities, openingHours } = req.body;
    const db = getDatabase();

    // Check if venue exists and user has permission
    const venue = await db.get('SELECT * FROM venues WHERE id = ?', [id]);
    if (!venue) {
      return res.status(404).json({
        success: false,
        error: 'Venue not found'
      });
    }

    if (req.user.role !== 'admin' && venue.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this venue'
      });
    }

    // Update venue
    const updateFields = [];
    const updateValues = [];

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (description) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }

    if (location) {
      updateFields.push('location = ?');
      updateValues.push(location);
    }

    if (address) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }

    if (latitude !== undefined) {
      updateFields.push('latitude = ?');
      updateValues.push(latitude);
    }

    if (longitude !== undefined) {
      updateFields.push('longitude = ?');
      updateValues.push(longitude);
    }

    if (images) {
      updateFields.push('images = ?');
      updateValues.push(JSON.stringify(images));
    }

    if (amenities) {
      updateFields.push('amenities = ?');
      updateValues.push(JSON.stringify(amenities));
    }

    if (openingHours) {
      updateFields.push('openingHours = ?');
      updateValues.push(JSON.stringify(openingHours));
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
      UPDATE venues 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    const updatedVenue = await db.get('SELECT * FROM venues WHERE id = ?', [id]);

    res.json({
      success: true,
      data: updatedVenue
    });
  } catch (error) {
    console.error('Update venue error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get available time slots for a court
// @route   GET /api/venues/:venueId/courts/:courtId/slots
// @access  Public
router.get('/:venueId/courts/:courtId/slots', [
  query('date').isDate().withMessage('Valid date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { venueId, courtId } = req.params;
    const { date } = req.query;
    const db = getDatabase();

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = new Date(date).getDay();

    // Get available time slots
    const slots = await db.all(`
      SELECT ts.*
      FROM timeSlots ts
      WHERE ts.courtId = ? AND ts.dayOfWeek = ? AND ts.isAvailable = 1 AND ts.isMaintenance = 0
      ORDER BY ts.startTime
    `, [courtId, dayOfWeek]);

    // Get existing bookings for this date
    const bookings = await db.all(`
      SELECT startTime, endTime
      FROM bookings
      WHERE courtId = ? AND date = ? AND status IN ('confirmed', 'pending')
    `, [courtId, date]);

    // Filter out booked slots
    const availableSlots = slots.map(slot => {
      return !bookings.some(booking => {
        const slotStart = slot.startTime;
        const slotEnd = slot.endTime;
        const bookingStart = booking.startTime;
        const bookingEnd = booking.endTime;
        
        // Check if slots overlap
        const isBooked = (slotStart < bookingEnd && slotEnd > bookingStart);
        return isBooked;
      }) ? { ...slot, booked: true } : { ...slot, booked: false };
    });

    res.json({
      success: true,
      data: availableSlots
    });
  } catch (error) {
    console.error('Get time slots error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete venue
// @route   DELETE /api/venues/:id
// @access  Private (Owner/Admin)
router.delete('/:id', protect, authorize('owner', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Check if venue exists and user has permission
    const venue = await db.get('SELECT * FROM venues WHERE id = ?', [id]);
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        error: 'Venue not found'
      });
    }

    // Only owner or admin can delete
    if (req.user.role !== 'admin' && venue.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this venue'
      });
    }

    // Delete venue (cascading will handle related records)
    await db.run('DELETE FROM venues WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Venue deleted successfully'
    });
  } catch (error) {
    console.error('Delete venue error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;
