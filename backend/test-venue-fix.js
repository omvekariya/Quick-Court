import jwt from 'jsonwebtoken';
import { getDatabase, initializeDatabase } from './src/database/init.js';

const testVenueRoute = async () => {
  try {
    await initializeDatabase();
    const db = getDatabase();
    
    console.log('🧪 Testing venue route fix...');
    
    // Get a test user with owner role
    const owner = await db.get('SELECT id, role FROM users WHERE role = ? LIMIT 1', ['owner']);
    if (!owner) {
      console.log('❌ No owner user found in database');
      return;
    }
    
    console.log(`✅ Found owner user: ${owner.id} with role: ${owner.role}`);
    
    // Get a test venue
    const venue = await db.get('SELECT id, name, isApproved, isActive FROM venues LIMIT 1');
    if (!venue) {
      console.log('❌ No venues found in database');
      return;
    }
    
    console.log(`✅ Found venue: ${venue.name} (ID: ${venue.id})`);
    
    // Test the visibility logic
    const requester = { id: owner.id, role: owner.role };
    console.log(`🔐 Testing with requester: ${requester.role} (${requester.id})`);
    
    let visibilityCondition;
    let visibilityParams = [];
    
    if (requester && requester.role === 'admin') {
      visibilityCondition = '1=1';
    } else if (requester && requester.role === 'owner') {
      visibilityCondition = '(v.isApproved = 1 OR v.ownerId = ?)';
      visibilityParams = [requester.id];
    } else {
      visibilityCondition = 'v.isApproved = 1';
    }
    
    console.log(`📋 Visibility condition: ${visibilityCondition}`);
    console.log(`📋 Visibility params: [${visibilityParams.join(', ')}]`);
    
    // Test the actual query
    const testVenue = await db.get(`
      SELECT v.*, u.fullName as ownerName
      FROM venues v
      LEFT JOIN users u ON v.ownerId = u.id
      WHERE v.id = ? AND v.isActive = 1 AND ${visibilityCondition}
    `, [venue.id, ...visibilityParams]);
    
    if (testVenue) {
      console.log(`✅ Query successful! Found venue: ${testVenue.name}`);
      console.log(`   Owner: ${testVenue.ownerName}`);
      console.log(`   Approved: ${testVenue.isApproved}`);
    } else {
      console.log('❌ Query failed - no venue returned');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testVenueRoute();
