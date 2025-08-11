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
      ORDER BY b.date DESC, b.createdAt DESC
    `, [req.user.id]);

    // Fetch slots for each booking
    const bookingsWithSlots = await Promise.all(
      bookings.map(async (booking) => {
        const slots = await db.all(`
          SELECT startTime, endTime, duration, slotAmount
          FROM bookingSlots
          WHERE bookingId = ?
          ORDER BY startTime
        `, [booking.id]);
        
        return {
          ...booking,
          slots: slots
        };
      })
    );

    res.json({
      success: true,
      data: bookingsWithSlots
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

    // Get current date and calculate date ranges
    const currentDate = new Date();
    const last30Days = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Basic totals
    const totals = await db.get(`
      SELECT 
        COUNT(DISTINCT v.id) as totalVenues,
        COUNT(DISTINCT c.id) as totalCourts,
        SUM(CASE WHEN c.isActive = 1 THEN 1 ELSE 0 END) as activeCourts,
        SUM(CASE WHEN c.isActive = 0 THEN 1 ELSE 0 END) as inactiveCourts,
        COUNT(DISTINCT b.id) as totalBookings,
        COUNT(DISTINCT CASE WHEN b.date >= date('now','-30 day') THEN b.id END) as bookingsLast30Days,
        COUNT(DISTINCT CASE WHEN b.date >= date('now','-7 day') THEN b.id END) as bookingsLast7Days
      FROM venues v
      LEFT JOIN courts c ON v.id = c.venueId
      LEFT JOIN bookings b ON c.id = b.courtId
      WHERE v.ownerId = ?
    `, [ownerId]);

    // Financial metrics
    const financial = await db.get(`
      SELECT 
        IFNULL(SUM(CASE WHEN b.status IN ('confirmed','completed') THEN b.totalAmount ELSE 0 END), 0) as totalEarnings,
        IFNULL(SUM(CASE WHEN b.date >= date('now','-30 day') AND b.status IN ('confirmed','completed') THEN b.totalAmount ELSE 0 END), 0) as earningsLast30Days,
        IFNULL(SUM(CASE WHEN b.date >= date('now','-7 day') AND b.status IN ('confirmed','completed') THEN b.totalAmount ELSE 0 END), 0) as earningsLast7Days,
        IFNULL(SUM(CASE WHEN b.date >= date('${thisMonth.toISOString().split('T')[0]}') AND b.status IN ('confirmed','completed') THEN b.totalAmount ELSE 0 END), 0) as earningsThisMonth,
        IFNULL(SUM(CASE WHEN b.date >= date('${lastMonth.toISOString().split('T')[0]}') AND b.date < date('${thisMonth.toISOString().split('T')[0]}') AND b.status IN ('confirmed','completed') THEN b.totalAmount ELSE 0 END), 0) as earningsLastMonth,
        IFNULL(AVG(CASE WHEN b.status IN ('confirmed','completed') THEN b.totalAmount ELSE NULL END), 0) as averageBookingValue
      FROM bookings b
      JOIN courts c ON b.courtId = c.id
      JOIN venues v ON c.venueId = v.id
      WHERE v.ownerId = ?
    `, [ownerId]);

    // Venue performance
    const venuePerformance = await db.all(`
      SELECT 
        v.id,
        v.name as venueName,
        COUNT(DISTINCT c.id) as courtCount,
        COUNT(DISTINCT b.id) as bookingCount,
        IFNULL(SUM(CASE WHEN b.status IN ('confirmed','completed') THEN b.totalAmount ELSE 0 END), 0) as venueEarnings,
        v.rating,
        v.isApproved
      FROM venues v
      LEFT JOIN courts c ON v.id = c.venueId
      LEFT JOIN bookings b ON c.id = b.courtId
      WHERE v.ownerId = ?
      GROUP BY v.id
      ORDER BY venueEarnings DESC
    `, [ownerId]);

    // Court utilization
    const courtUtilization = await db.all(`
      SELECT 
        c.id,
        c.name as courtName,
        v.name as venueName,
        COUNT(b.id) as bookingCount,
        IFNULL(SUM(CASE WHEN b.status IN ('confirmed','completed') THEN b.totalAmount ELSE 0 END), 0) as courtEarnings,
        c.pricePerHour,
        c.isActive
      FROM courts c
      JOIN venues v ON c.venueId = v.id
      LEFT JOIN bookings b ON c.id = b.courtId
      WHERE v.ownerId = ?
      GROUP BY c.id
      ORDER BY courtEarnings DESC
    `, [ownerId]);

    // Booking trends (last 30 days)
    const trends = await db.all(`
      SELECT 
        date as day, 
        COUNT(*) as bookings,
        IFNULL(SUM(totalAmount), 0) as revenue
      FROM bookings b
      JOIN courts c ON b.courtId = c.id
      JOIN venues v ON c.venueId = v.id
      WHERE v.ownerId = ? AND date >= date('now','-30 day')
      GROUP BY date
      ORDER BY date
    `, [ownerId]);

    // Peak hours analysis
    const peakHours = await db.all(`
      SELECT 
        substr(bs.startTime,1,2) as hour, 
        COUNT(*) as bookingCount,
        IFNULL(SUM(b.totalAmount), 0) as revenue
      FROM bookings b
      JOIN bookingSlots bs ON b.id = bs.bookingId
      JOIN courts c ON b.courtId = c.id
      JOIN venues v ON c.venueId = v.id
      WHERE v.ownerId = ? AND b.date >= date('now','-30 day')
      GROUP BY substr(bs.startTime,1,2)
      ORDER BY hour
    `, [ownerId]);

    // Sport popularity
    const sportPopularity = await db.all(`
      SELECT 
        s.name as sportName,
        s.icon as sportIcon,
        COUNT(b.id) as bookingCount,
        IFNULL(SUM(b.totalAmount), 0) as revenue
      FROM bookings b
      JOIN courts c ON b.courtId = c.id
      JOIN sports s ON c.sportId = s.id
      JOIN venues v ON c.venueId = v.id
      WHERE v.ownerId = ? AND b.date >= date('now','-30 day')
      GROUP BY s.id
      ORDER BY bookingCount DESC
    `, [ownerId]);

    // Customer insights
    const customerInsights = await db.all(`
      SELECT 
        u.fullName as customerName,
        u.email as customerEmail,
        COUNT(b.id) as bookingCount,
        IFNULL(SUM(b.totalAmount), 0) as totalSpent,
        MAX(b.date) as lastBooking
      FROM bookings b
      JOIN courts c ON b.courtId = c.id
      JOIN venues v ON c.venueId = v.id
      JOIN users u ON b.userId = u.id
      WHERE v.ownerId = ? AND b.date >= date('now','-90 day')
      GROUP BY u.id
      ORDER BY totalSpent DESC
      LIMIT 10
    `, [ownerId]);

    // Calculate growth rates
    const currentPeriodBookings = totals?.bookingsLast7Days || 0;
    const previousPeriodBookings = await db.get(`
      SELECT COUNT(DISTINCT b.id) as count
      FROM bookings b
      JOIN courts c ON b.courtId = c.id
      JOIN venues v ON c.venueId = v.id
      WHERE v.ownerId = ? AND b.date >= date('now','-14 day') AND b.date < date('now','-7 day')
    `, [ownerId]);
    
    const previousPeriodBookingsCount = previousPeriodBookings?.count || 0;
    const bookingGrowthRate = previousPeriodBookingsCount > 0 
      ? ((currentPeriodBookings - previousPeriodBookingsCount) / previousPeriodBookingsCount * 100).toFixed(1)
      : 0;

    // Calculate revenue growth
    const currentPeriodRevenue = financial?.earningsLast7Days || 0;
    const previousPeriodRevenue = await db.get(`
      SELECT IFNULL(SUM(b.totalAmount), 0) as amount
      FROM bookings b
      JOIN courts c ON b.courtId = c.id
      JOIN venues v ON c.venueId = v.id
      WHERE v.ownerId = ? AND b.date >= date('now','-14 day') AND b.date < date('now','-7 day') AND b.status IN ('confirmed','completed')
    `, [ownerId]);
    
    const previousPeriodRevenueAmount = previousPeriodRevenue?.amount || 0;
    const revenueGrowthRate = previousPeriodRevenueAmount > 0 
      ? ((currentPeriodRevenue - previousPeriodRevenueAmount) / previousPeriodRevenueAmount * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalVenues: totals?.totalVenues || 0,
          totalCourts: totals?.totalCourts || 0,
          activeCourts: totals?.activeCourts || 0,
          inactiveCourts: totals?.inactiveCourts || 0,
          totalBookings: totals?.totalBookings || 0,
          bookingsLast30Days: totals?.bookingsLast30Days || 0,
          bookingsLast7Days: totals?.bookingsLast7Days || 0,
          bookingGrowthRate: parseFloat(bookingGrowthRate),
          revenueGrowthRate: parseFloat(revenueGrowthRate)
        },
        financial: {
          totalEarnings: financial?.totalEarnings || 0,
          earningsLast30Days: financial?.earningsLast30Days || 0,
          earningsLast7Days: financial?.earningsLast7Days || 0,
          earningsThisMonth: financial?.earningsThisMonth || 0,
          earningsLastMonth: financial?.earningsLastMonth || 0,
          averageBookingValue: financial?.averageBookingValue || 0
        },
        venuePerformance,
        courtUtilization,
        trends,
        peakHours,
        sportPopularity,
        customerInsights
      }
    });
  } catch (error) {
    console.error('Owner stats error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});
export default router;
