import express from 'express';
import { getDatabase } from '../database/init.js';
import { protect, authorize } from '../middleware/auth.js';
import { randomUUID } from 'crypto';

const router = express.Router();

// All routes require owner role
router.use(protect, authorize('owner'));

// @desc    Get owner's venues
// @route   GET /api/owner/venues
// @access  Private (Owner)
router.get('/venues', async (req, res) => {
  try {
    const db = getDatabase();
    const venues = await db.all(`
      SELECT v.*, 
        COUNT(DISTINCT c.id) as courtCount,
        SUM(CASE WHEN c.isActive = 1 THEN 1 ELSE 0 END) as activeCourts,
        GROUP_CONCAT(DISTINCT s.name) as sportTypes
      FROM venues v
      LEFT JOIN courts c ON v.id = c.venueId
      LEFT JOIN sports s ON c.sportId = s.id
      WHERE v.ownerId = ?
      GROUP BY v.id
      ORDER BY v.createdAt DESC
    `, [req.user.id]);

    const formatted = venues.map(v => ({
      ...v,
      images: v.images ? JSON.parse(v.images) : [],
      amenities: v.amenities ? JSON.parse(v.amenities) : [],
      openingHours: v.openingHours ? JSON.parse(v.openingHours) : {},
      sportTypes: v.sportTypes ? v.sportTypes.split(',') : []
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Get owner venues error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get owner's bookings
// @route   GET /api/owner/bookings
// @access  Private (Owner)
router.get('/bookings', async (req, res) => {
  try {
    const db = getDatabase();
    const bookings = await db.all(`
      SELECT b.*, c.name as courtName, v.name as venueName, u.fullName as userName, u.email as userEmail
      FROM bookings b
      LEFT JOIN courts c ON b.courtId = c.id
      LEFT JOIN venues v ON c.venueId = v.id
      LEFT JOIN users u ON b.userId = u.id
      WHERE v.ownerId = ?
      ORDER BY b.date DESC, b.startTime DESC
    `, [req.user.id]);

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Get owner bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get courts for a specific owner venue
// @route   GET /api/owner/venues/:venueId/courts
// @access  Private (Owner)
router.get('/venues/:venueId/courts', async (req, res) => {
  try {
    const { venueId } = req.params;
    const db = getDatabase();
    const venue = await db.get('SELECT * FROM venues WHERE id = ? AND ownerId = ?', [venueId, req.user.id]);
    if (!venue) {
      return res.status(404).json({ success: false, error: 'Venue not found' });
    }

    const courts = await db.all(`
      SELECT c.*, s.name as sportName, s.icon as sportIcon
      FROM courts c LEFT JOIN sports s ON c.sportId = s.id
      WHERE c.venueId = ?
      ORDER BY c.createdAt DESC
    `, [venueId]);

    res.json({ success: true, data: courts });
  } catch (error) {
    console.error('Get owner venue courts error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @desc    Get time slots for a court (owner)
// @route   GET /api/owner/courts/:courtId/slots
// @access  Private (Owner)
router.get('/courts/:courtId/slots', async (req, res) => {
  try {
    const { courtId } = req.params;
    const db = getDatabase();
    const court = await db.get(`SELECT c.*, v.ownerId FROM courts c JOIN venues v ON c.venueId = v.id WHERE c.id = ?`, [courtId]);
    if (!court || court.ownerId !== req.user.id) return res.status(404).json({ success: false, error: 'Court not found' });

    const slots = await db.all('SELECT * FROM timeSlots WHERE courtId = ? ORDER BY dayOfWeek, startTime', [courtId]);
    res.json({ success: true, data: slots });
  } catch (error) {
    console.error('Get owner court slots error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @desc    Bulk upsert time slots for a court
// @route   POST /api/owner/courts/:courtId/slots/bulk
// @access  Private (Owner)
router.post('/courts/:courtId/slots/bulk', async (req, res) => {
  try {
    const { courtId } = req.params;
    const { slots } = req.body; // [{dayOfWeek, startTime, endTime, isAvailable}]
    const db = getDatabase();
    const court = await db.get(`SELECT c.*, v.ownerId FROM courts c JOIN venues v ON c.venueId = v.id WHERE c.id = ?`, [courtId]);
    if (!court || court.ownerId !== req.user.id) return res.status(404).json({ success: false, error: 'Court not found' });

    if (!Array.isArray(slots)) return res.status(400).json({ success: false, error: 'slots must be an array' });

    await db.run('BEGIN');
    for (const s of slots) {
      // Try to find existing
      const existing = await db.get(`
        SELECT id FROM timeSlots WHERE courtId = ? AND dayOfWeek = ? AND startTime = ? AND endTime = ?
      `, [courtId, s.dayOfWeek, s.startTime, s.endTime]);
      if (existing) {
        await db.run('UPDATE timeSlots SET isAvailable = ?, isMaintenance = ? WHERE id = ?', [s.isAvailable ? 1 : 0, s.isMaintenance ? 1 : 0, existing.id]);
      } else {
        await db.run(`
          INSERT INTO timeSlots (id, courtId, startTime, endTime, dayOfWeek, isAvailable, isMaintenance)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [randomUUID(), courtId, s.startTime, s.endTime, s.dayOfWeek, s.isAvailable ? 1 : 0, s.isMaintenance ? 1 : 0]);
      }
    }
    await db.run('COMMIT');

    const updated = await db.all('SELECT * FROM timeSlots WHERE courtId = ? ORDER BY dayOfWeek, startTime', [courtId]);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Bulk upsert slots error:', error);
    try { await getDatabase().run('ROLLBACK'); } catch {}
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @desc    Owner dashboard stats
// @route   GET /api/owner/dashboard/stats
// @access  Private (Owner)
router.get('/dashboard/stats', async (req, res) => {
  try {
    const db = getDatabase();
    const ownerId = req.user.id;

    const totals = await db.get(`
      SELECT 
        COUNT(b.id) as totalBookings,
        SUM(CASE WHEN c.isActive = 1 THEN 1 ELSE 0 END) as activeCourts
      FROM venues v
      LEFT JOIN courts c ON v.id = c.venueId
      LEFT JOIN bookings b ON c.id = b.courtId
      WHERE v.ownerId = ?
    `, [ownerId]);

    const earningsRow = await db.get(`
      SELECT IFNULL(SUM(b.totalAmount), 0) as earnings
      FROM bookings b
      JOIN courts c ON b.courtId = c.id
      JOIN venues v ON c.venueId = v.id
      WHERE v.ownerId = ? AND b.status IN ('confirmed','completed')
    `, [ownerId]);

    // Trends last 30 days
    const trends = await db.all(`
      SELECT date as day, COUNT(*) as bookings
      FROM bookings b
      JOIN courts c ON b.courtId = c.id
      JOIN venues v ON c.venueId = v.id
      WHERE v.ownerId = ? AND date >= date('now','-30 day')
      GROUP BY date
      ORDER BY date
    `, [ownerId]);

    // Earnings by day (last 30 days)
    const earnings = await db.all(`
      SELECT date as day, SUM(totalAmount) as amount
      FROM bookings b
      JOIN courts c ON b.courtId = c.id
      JOIN venues v ON c.venueId = v.id
      WHERE v.ownerId = ? AND b.status IN ('confirmed','completed') AND date >= date('now','-30 day')
      GROUP BY date
      ORDER BY date
    `, [ownerId]);

    // Peak hours histogram (startTime hour)
    const peak = await db.all(`
      SELECT substr(startTime,1,2) as hour, COUNT(*) as count
      FROM bookings b
      JOIN courts c ON b.courtId = c.id
      JOIN venues v ON c.venueId = v.id
      WHERE v.ownerId = ? AND date >= date('now','-30 day')
      GROUP BY substr(startTime,1,2)
      ORDER BY hour
    `, [ownerId]);

    res.json({
      success: true,
      data: {
        totals: {
          totalBookings: totals?.totalBookings || 0,
          activeCourts: totals?.activeCourts || 0,
          earnings: earningsRow?.earnings || 0,
        },
        trends,
        earnings,
        peak
      }
    });
  } catch (error) {
    console.error('Owner stats error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});
export default router;
