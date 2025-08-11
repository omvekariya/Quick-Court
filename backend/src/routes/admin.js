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

// @desc    Update user (ban/unban, change role)
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, role } = req.body;
    const db = getDatabase();

    // Check if user exists
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent admin from changing their own role or status
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify your own account'
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    
    if (isActive !== undefined) {
      updates.push('isActive = ?');
      params.push(isActive ? 1 : 0);
    }
    
    if (role && ['user', 'owner', 'admin'].includes(role)) {
      updates.push('role = ?');
      params.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    params.push(id);
    
    await db.run(`
      UPDATE users 
      SET ${updates.join(', ')}, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, params);

    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Admin dashboard stats
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin)
router.get('/dashboard/stats', async (req, res) => {
  try {
    const db = getDatabase();

    // Platform overview metrics
    const overview = await db.get(`
      SELECT 
        COUNT(DISTINCT u.id) as totalUsers,
        COUNT(DISTINCT CASE WHEN u.role = 'user' THEN u.id END) as regularUsers,
        COUNT(DISTINCT CASE WHEN u.role = 'owner' THEN u.id END) as venueOwners,
        COUNT(DISTINCT v.id) as totalVenues,
        COUNT(DISTINCT CASE WHEN v.isApproved = 1 THEN v.id END) as approvedVenues,
        COUNT(DISTINCT CASE WHEN v.isApproved = 0 THEN v.id END) as pendingVenues,
        COUNT(DISTINCT c.id) as totalCourts,
        COUNT(DISTINCT CASE WHEN c.isActive = 1 THEN c.id END) as activeCourts,
        COUNT(DISTINCT b.id) as totalBookings,
        COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) as confirmedBookings,
        COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelledBookings
      FROM users u
      LEFT JOIN venues v ON u.id = v.ownerId
      LEFT JOIN courts c ON v.id = c.venueId
      LEFT JOIN bookings b ON c.id = b.courtId
    `);

    // Financial metrics
    const financial = await db.get(`
      SELECT 
        IFNULL(SUM(CASE WHEN b.status IN ('confirmed','completed') THEN b.totalAmount ELSE 0 END), 0) as totalRevenue,
        IFNULL(SUM(CASE WHEN b.date >= date('now','-30 day') AND b.status IN ('confirmed','completed') THEN b.totalAmount ELSE 0 END), 0) as revenueLast30Days,
        IFNULL(SUM(CASE WHEN b.date >= date('now','-7 day') AND b.status IN ('confirmed','completed') THEN b.totalAmount ELSE 0 END), 0) as revenueLast7Days,
        IFNULL(AVG(CASE WHEN b.status IN ('confirmed','completed') THEN b.totalAmount ELSE NULL END), 0) as averageBookingValue,
        IFNULL(SUM(CASE WHEN b.date >= date('now', 'start of month') AND b.status IN ('confirmed','completed') THEN b.totalAmount ELSE 0 END), 0) as revenueThisMonth
      FROM bookings b
    `);

    // User growth trends (last 30 days)
    const userGrowth = await db.all(`
      SELECT 
        date(createdAt) as day, 
        COUNT(*) as newUsers,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as newRegularUsers,
        SUM(CASE WHEN role = 'owner' THEN 1 ELSE 0 END) as newOwners
      FROM users 
      WHERE createdAt >= date('now','-30 day')
      GROUP BY date(createdAt)
      ORDER BY day
    `);

    // Venue approval trends
    const venueApprovals = await db.all(`
      SELECT 
        COALESCE(date(updatedAt), date(createdAt)) as day,
        COUNT(CASE WHEN isApproved = 1 THEN 1 END) as approved,
        COUNT(CASE WHEN isApproved = 0 THEN 1 END) as rejected
      FROM venues 
      WHERE (updatedAt >= date('now','-30 day') OR createdAt >= date('now','-30 day'))
      GROUP BY COALESCE(date(updatedAt), date(createdAt))
      ORDER BY day
    `);

    // Booking trends (last 30 days)
    const bookingTrends = await db.all(`
      SELECT 
        date as day, 
        COUNT(*) as totalBookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmedBookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelledBookings,
        IFNULL(SUM(totalAmount), 0) as dailyRevenue
      FROM bookings 
      WHERE date >= date('now','-30 day')
      GROUP BY date
      ORDER BY date
    `);

    // Sport popularity across platform
    const sportPopularity = await db.all(`
      SELECT 
        s.name as sportName,
        s.icon as sportIcon,
        COUNT(DISTINCT c.id) as courtCount,
        COUNT(b.id) as bookingCount,
        IFNULL(SUM(b.totalAmount), 0) as totalRevenue
      FROM sports s
      LEFT JOIN courts c ON s.id = c.sportId
      LEFT JOIN bookings b ON c.id = b.courtId
      WHERE s.isActive = 1
      GROUP BY s.id
      ORDER BY bookingCount DESC
    `);

    // Top performing venues
    const topVenues = await db.all(`
      SELECT 
        v.id,
        v.name as venueName,
        u.fullName as ownerName,
        COUNT(DISTINCT c.id) as courtCount,
        COUNT(b.id) as bookingCount,
        IFNULL(SUM(CASE WHEN b.status IN ('confirmed','completed') THEN b.totalAmount ELSE 0 END), 0) as totalRevenue,
        v.rating,
        v.isApproved
      FROM venues v
      LEFT JOIN users u ON v.ownerId = u.id
      LEFT JOIN courts c ON v.id = c.venueId
      LEFT JOIN bookings b ON c.id = b.courtId
      WHERE v.isApproved = 1
      GROUP BY v.id
      ORDER BY totalRevenue DESC
      LIMIT 10
    `);

    // Recent activity (last 7 days)
    const recentActivity = await db.all(`
      SELECT 
        'user_registration' as type,
        u.fullName as name,
        u.email as email,
        u.role as role,
        u.createdAt as timestamp
      FROM users u
      WHERE u.createdAt >= date('now','-7 day')
      
      UNION ALL
      
      SELECT 
        'venue_created' as type,
        v.name as name,
        u.email as email,
        'venue' as role,
        v.createdAt as timestamp
      FROM venues v
      JOIN users u ON v.ownerId = u.id
      WHERE v.createdAt >= date('now','-7 day')
      
      UNION ALL
      
      SELECT 
        'booking_made' as type,
        u.fullName as name,
        u.email as email,
        'booking' as role,
        b.createdAt as timestamp
      FROM bookings b
      JOIN users u ON b.userId = u.id
      WHERE b.createdAt >= date('now','-7 day')
      
      ORDER BY timestamp DESC
      LIMIT 20
    `);

    // Geographic distribution (if venues have location data)
    const venueDistribution = await db.all(`
      SELECT 
        COALESCE(v.location, 'Unknown') as location,
        COUNT(*) as venueCount,
        COUNT(CASE WHEN v.isApproved = 1 THEN 1 END) as approvedCount,
        COUNT(CASE WHEN v.isApproved = 0 THEN 1 END) as pendingCount
      FROM venues v
      GROUP BY COALESCE(v.location, 'Unknown')
      ORDER BY venueCount DESC
      LIMIT 10
    `);

    // System health metrics
    const systemHealth = await db.get(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE isActive = 0) as bannedUsers,
        (SELECT COUNT(*) FROM venues WHERE isActive = 0) as inactiveVenues,
        (SELECT COUNT(*) FROM courts WHERE isActive = 0) as inactiveCourts,
        (SELECT COUNT(*) FROM bookings WHERE status = 'cancelled') as cancelledBookings,
        (SELECT COUNT(*) FROM users WHERE isVerified = 0) as unverifiedUsers
      FROM (SELECT 1)
    `);

    res.json({
      success: true,
      data: {
        overview,
        financial,
        userGrowth,
        venueApprovals,
        bookingTrends,
        sportPopularity,
        topVenues,
        recentActivity,
        venueDistribution,
        systemHealth
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
