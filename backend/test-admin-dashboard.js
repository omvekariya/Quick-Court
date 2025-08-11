import { getDatabase } from './src/database/init.js';

async function testAdminDashboard() {
  try {
    const db = getDatabase();
    console.log('Testing admin dashboard queries...');

    // Test basic database connection
    const testQuery = await db.get('SELECT COUNT(*) as count FROM venues');
    console.log('Database connection test:', testQuery);

    // Test platform overview query
    try {
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
      console.log('Platform overview query successful:', overview);
    } catch (error) {
      console.log('Platform overview query failed:', error.message);
    }

    // Test financial metrics query
    try {
      const financial = await db.get(`
        SELECT 
          IFNULL(SUM(CASE WHEN b.status IN ('confirmed','completed') THEN b.totalAmount ELSE 0 END), 0) as totalRevenue,
          IFNULL(SUM(CASE WHEN b.date >= date('now','-30 day') AND b.status IN ('confirmed','completed') THEN b.totalAmount ELSE 0 END), 0) as revenueLast30Days,
          IFNULL(SUM(CASE WHEN b.date >= date('now','-7 day') AND b.status IN ('confirmed','completed') THEN b.totalAmount ELSE 0 END), 0) as revenueLast7Days,
          IFNULL(AVG(CASE WHEN b.status IN ('confirmed','completed') THEN b.totalAmount ELSE NULL END), 0) as averageBookingValue,
          IFNULL(SUM(CASE WHEN b.date >= date('now', 'start of month') AND b.status IN ('confirmed','completed') THEN b.totalAmount ELSE 0 END), 0) as revenueThisMonth
        FROM bookings b
      `);
      console.log('Financial metrics query successful:', financial);
    } catch (error) {
      console.log('Financial metrics query failed:', error.message);
    }

    // Test venue distribution query
    try {
      const venueDistribution = await db.all(`
        SELECT 
          COALESCE(v.location, 'Unknown') as location,
          COUNT(*) as venueCount,
          COUNT(CASE WHEN v.isApproved = 1 THEN 1 END) as approvedCount,
          COUNT(CASE WHEN v.isApproved = 0 THEN 1 END) as pendingCount
        FROM venues v
        GROUP BY COALESCE(v.location, 'Unknown')
        ORDER BY venueCount DESC
        LIMIT 5
      `);
      console.log('Venue distribution query successful:', venueDistribution);
    } catch (error) {
      console.log('Venue distribution query failed:', error.message);
    }

    // Test user growth query
    try {
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
        LIMIT 5
      `);
      console.log('User growth query successful:', userGrowth);
    } catch (error) {
      console.log('User growth query failed:', error.message);
    }

    console.log('All admin dashboard queries tested successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAdminDashboard();
