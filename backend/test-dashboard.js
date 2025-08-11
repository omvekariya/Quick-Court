import { getDatabase } from './src/database/init.js';

async function testDashboardQueries() {
  try {
    const db = getDatabase();
    console.log('Testing dashboard queries...');

    // Test basic database connection
    const testQuery = await db.get('SELECT COUNT(*) as count FROM venues');
    console.log('Database connection test:', testQuery);

    // Test if bookingSlots table exists
    const bookingSlotsTest = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='bookingSlots'");
    console.log('bookingSlots table exists:', !!bookingSlotsTest);

    // Test if bookings table has the right structure
    const bookingsStructure = await db.all("PRAGMA table_info(bookings)");
    console.log('Bookings table columns:', bookingsStructure.map(col => col.name));

    // Test if bookingSlots table has the right structure
    const bookingSlotsStructure = await db.all("PRAGMA table_info(bookingSlots)");
    console.log('BookingSlots table columns:', bookingSlotsStructure.map(col => col.name));

    // Test a simple peak hours query
    try {
      const peakHoursTest = await db.all(`
        SELECT 
          substr(bs.startTime,1,2) as hour, 
          COUNT(*) as bookingCount
        FROM bookings b
        JOIN bookingSlots bs ON b.id = bs.bookingId
        JOIN courts c ON b.courtId = c.id
        JOIN venues v ON c.venueId = v.id
        WHERE v.ownerId = 'test-owner-id'
        GROUP BY substr(bs.startTime,1,2)
        ORDER BY hour
        LIMIT 5
      `);
      console.log('Peak hours query test successful:', peakHoursTest.length, 'results');
    } catch (error) {
      console.log('Peak hours query test failed:', error.message);
    }

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDashboardQueries();
