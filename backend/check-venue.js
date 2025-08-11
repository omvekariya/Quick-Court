import { getDatabase, initializeDatabase } from './src/database/init.js';

const checkVenue = async () => {
  try {
    await initializeDatabase();
    const db = getDatabase();

    const venueId = 'cc006818-1e83-4ef3-b82b-3dea9dbce75a';
    
    console.log('🔍 Checking venue:', venueId);
    
    // Check if venue exists
    const venue = await db.get('SELECT * FROM venues WHERE id = ?', [venueId]);
    
    if (venue) {
      console.log('✅ Venue found:');
      console.log('  - Name:', venue.name);
      console.log('  - Approved:', venue.isApproved);
      console.log('  - Active:', venue.isActive);
      console.log('  - Owner ID:', venue.ownerId);
    } else {
      console.log('❌ Venue not found');
      
      // Check all venues
      const allVenues = await db.all('SELECT id, name, isApproved, isActive FROM venues LIMIT 5');
      console.log('\n📋 Sample venues in database:');
      allVenues.forEach(v => {
        console.log(`  - ${v.name} (ID: ${v.id}) - Approved: ${v.isApproved}, Active: ${v.isActive}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

checkVenue();
