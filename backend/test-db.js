import { getDatabase, initializeDatabase } from './src/database/init.js';

const testDatabase = async () => {
  try {
    await initializeDatabase();
    const db = getDatabase();

    console.log('🔍 Testing database state...\n');

    // Check all venues
    const allVenues = await db.all('SELECT id, name, isApproved, isActive FROM venues');
    console.log('📋 All venues:');
    allVenues.forEach(venue => {
      console.log(`  - ${venue.name} (ID: ${venue.id}) - Approved: ${venue.isApproved}, Active: ${venue.isActive}`);
    });

    // Check pending venues
    const pendingVenues = await db.all(`
      SELECT v.id, v.name, v.isApproved, v.isActive, u.fullName as ownerName
      FROM venues v
      LEFT JOIN users u ON v.ownerId = u.id
      WHERE v.isApproved = 0 AND v.isActive = 1
    `);
    console.log('\n⏳ Pending venues:');
    pendingVenues.forEach(venue => {
      console.log(`  - ${venue.name} (ID: ${venue.id}) - Owner: ${venue.ownerName}`);
    });

    // Check specific venue
    const testVenueId = 'cc006818-1e83-4ef3-b82b-3dea9dbce75a';
    const specificVenue = await db.get('SELECT * FROM venues WHERE id = ?', [testVenueId]);
    console.log(`\n🎯 Specific venue (${testVenueId}):`);
    if (specificVenue) {
      console.log(`  - Name: ${specificVenue.name}`);
      console.log(`  - Approved: ${specificVenue.isApproved}`);
      console.log(`  - Active: ${specificVenue.isActive}`);
      console.log(`  - Owner ID: ${specificVenue.ownerId}`);
    } else {
      console.log('  - Not found');
    }

  } catch (error) {
    console.error('❌ Error testing database:', error);
  }
};

testDatabase();
