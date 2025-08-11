import { getDatabase, initializeDatabase } from './init.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

const seedDatabase = async () => {
  try {
    await initializeDatabase();
    const db = getDatabase();

    console.log('🌱 Seeding database...');

    // Create sports
    const sports = [
      { id: uuidv4(), name: 'Basketball', description: 'Indoor basketball courts', icon: '🏀', isActive: 1 },
      { id: uuidv4(), name: 'Tennis', description: 'Tennis courts', icon: '🎾', isActive: 1 },
      { id: uuidv4(), name: 'Badminton', description: 'Badminton courts', icon: '🏸', isActive: 1 },
      { id: uuidv4(), name: 'Soccer', description: 'Soccer fields', icon: '⚽', isActive: 1 },
      { id: uuidv4(), name: 'Volleyball', description: 'Volleyball courts', icon: '🏐', isActive: 1 },
      { id: uuidv4(), name: 'Table Tennis', description: 'Table tennis tables', icon: '🏓', isActive: 1 },
      { id: uuidv4(), name: 'Cricket', description: 'Cricket grounds', icon: '🏏', isActive: 1 },
      { id: uuidv4(), name: 'Swimming', description: 'Swimming pools', icon: '🏊', isActive: 1 },
    ];

    for (const sport of sports) {
      await db.run(
        'INSERT OR IGNORE INTO sports (id, name, description, icon, isActive, createdAt) VALUES (?, ?, ?, ?, ?, datetime("now"))',
        [sport.id, sport.name, sport.description, sport.icon, sport.isActive]
      );
    }

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const users = [
      {
        id: uuidv4(),
        email: 'admin@quickcourt.com',
        password: hashedPassword,
        fullName: 'Admin User',
        phone: '+1234567890',
        role: 'admin',
        isVerified: 1,
        isActive: 1,
      },
      {
        id: uuidv4(),
        email: 'owner@quickcourt.com',
        password: hashedPassword,
        fullName: 'Venue Owner',
        phone: '+1234567891',
        role: 'owner',
        isVerified: 1,
        isActive: 1,
      },
      {
        id: uuidv4(),
        email: 'user@quickcourt.com',
        password: hashedPassword,
        fullName: 'Regular User',
        phone: '+1234567892',
        role: 'user',
        isVerified: 1,
        isActive: 1,
      },
      {
        id: uuidv4(),
        email: 'john@example.com',
        password: hashedPassword,
        fullName: 'John Smith',
        phone: '+1234567893',
        role: 'user',
        isVerified: 1,
        isActive: 1,
      },
      {
        id: uuidv4(),
        email: 'sarah@example.com',
        password: hashedPassword,
        fullName: 'Sarah Johnson',
        phone: '+1234567894',
        role: 'user',
        isVerified: 1,
        isActive: 1,
      },
      {
        id: uuidv4(),
        email: 'mike@example.com',
        password: hashedPassword,
        fullName: 'Mike Wilson',
        phone: '+1234567895',
        role: 'owner',
        isVerified: 1,
        isActive: 1,
      },
    ];

    for (const user of users) {
      await db.run(
        'INSERT OR IGNORE INTO users (id, email, password, fullName, phone, role, isVerified, isActive, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))',
        [user.id, user.email, user.password, user.fullName, user.phone, user.role, user.isVerified, user.isActive]
      );
    }

    // Get user IDs for reference
    const adminUser = await db.get('SELECT id FROM users WHERE email = ?', ['admin@quickcourt.com']);
    const ownerUser = await db.get('SELECT id FROM users WHERE email = ?', ['owner@quickcourt.com']);
    const regularUser = await db.get('SELECT id FROM users WHERE email = ?', ['user@quickcourt.com']);
    const johnUser = await db.get('SELECT id FROM users WHERE email = ?', ['john@example.com']);
    const sarahUser = await db.get('SELECT id FROM users WHERE email = ?', ['sarah@example.com']);
    const mikeUser = await db.get('SELECT id FROM users WHERE email = ?', ['mike@example.com']);

    // Get sport IDs
    const basketballSport = await db.get('SELECT id FROM sports WHERE name = ?', ['Basketball']);
    const tennisSport = await db.get('SELECT id FROM sports WHERE name = ?', ['Tennis']);
    const badmintonSport = await db.get('SELECT id FROM sports WHERE name = ?', ['Badminton']);
    const soccerSport = await db.get('SELECT id FROM sports WHERE name = ?', ['Soccer']);
    const volleyballSport = await db.get('SELECT id FROM sports WHERE name = ?', ['Volleyball']);
    const tableTennisSport = await db.get('SELECT id FROM sports WHERE name = ?', ['Table Tennis']);

    // Create venues
    const venues = [
      {
        id: uuidv4(),
        name: 'Downtown Sports Center',
        description: 'Premium sports facility in the heart of downtown with multiple courts and amenities.',
        location: 'Downtown',
        address: '123 Main St, Downtown, City',
        latitude: 40.7128,
        longitude: -74.0060,
        ownerId: ownerUser.id,
        isApproved: 1,
        isActive: 1,
        rating: 4.5,
        totalRatings: 25,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'
        ]),
        amenities: JSON.stringify(['Parking', 'Shower', 'Equipment Rental', 'Cafe']),
        openingHours: JSON.stringify({
          monday: { open: '06:00', close: '22:00' },
          tuesday: { open: '06:00', close: '22:00' },
          wednesday: { open: '06:00', close: '22:00' },
          thursday: { open: '06:00', close: '22:00' },
          friday: { open: '06:00', close: '22:00' },
          saturday: { open: '08:00', close: '20:00' },
          sunday: { open: '08:00', close: '20:00' }
        }),
      },
      {
        id: uuidv4(),
        name: 'Riverside Tennis Club',
        description: 'Exclusive tennis club with professional courts and coaching services.',
        location: 'Riverside',
        address: '456 River Rd, Riverside, City',
        latitude: 40.7589,
        longitude: -73.9851,
        ownerId: ownerUser.id,
        isApproved: 1,
        isActive: 1,
        rating: 4.8,
        totalRatings: 15,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800',
          'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800'
        ]),
        amenities: JSON.stringify(['Parking', 'Pro Shop', 'Coaching', 'Restaurant']),
        openingHours: JSON.stringify({
          monday: { open: '07:00', close: '21:00' },
          tuesday: { open: '07:00', close: '21:00' },
          wednesday: { open: '07:00', close: '21:00' },
          thursday: { open: '07:00', close: '21:00' },
          friday: { open: '07:00', close: '21:00' },
          saturday: { open: '08:00', close: '18:00' },
          sunday: { open: '08:00', close: '18:00' }
        }),
      },
      {
        id: uuidv4(),
        name: 'Community Badminton Center',
        description: 'Friendly community center with multiple badminton courts for all skill levels.',
        location: 'Suburbs',
        address: '789 Community Ave, Suburbs, City',
        latitude: 40.7505,
        longitude: -73.9934,
        ownerId: ownerUser.id,
        isApproved: 1,
        isActive: 1,
        rating: 4.2,
        totalRatings: 8,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800',
          'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800'
        ]),
        amenities: JSON.stringify(['Parking', 'Equipment Rental', 'Vending Machines']),
        openingHours: JSON.stringify({
          monday: { open: '09:00', close: '21:00' },
          tuesday: { open: '09:00', close: '21:00' },
          wednesday: { open: '09:00', close: '21:00' },
          thursday: { open: '09:00', close: '21:00' },
          friday: { open: '09:00', close: '21:00' },
          saturday: { open: '10:00', close: '18:00' },
          sunday: { open: '10:00', close: '18:00' }
        }),
      },
      {
        id: uuidv4(),
        name: 'Elite Soccer Complex',
        description: 'Professional soccer complex with multiple fields and training facilities.',
        location: 'Sports District',
        address: '321 Sports Blvd, Sports District, City',
        latitude: 40.7305,
        longitude: -73.9355,
        ownerId: mikeUser.id,
        isApproved: 1,
        isActive: 1,
        rating: 4.6,
        totalRatings: 12,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'
        ]),
        amenities: JSON.stringify(['Parking', 'Training Grounds', 'Equipment Rental', 'Refreshments']),
        openingHours: JSON.stringify({
          monday: { open: '08:00', close: '20:00' },
          tuesday: { open: '08:00', close: '20:00' },
          wednesday: { open: '08:00', close: '20:00' },
          thursday: { open: '08:00', close: '20:00' },
          friday: { open: '08:00', close: '20:00' },
          saturday: { open: '09:00', close: '18:00' },
          sunday: { open: '09:00', close: '18:00' }
        }),
      },
      {
        id: uuidv4(),
        name: 'Volleyball Arena',
        description: 'Dedicated volleyball facility with indoor and outdoor courts.',
        location: 'Beach Area',
        address: '654 Beach Rd, Beach Area, City',
        latitude: 40.7589,
        longitude: -73.9851,
        ownerId: mikeUser.id,
        isApproved: 1,
        isActive: 1,
        rating: 4.4,
        totalRatings: 6,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'
        ]),
        amenities: JSON.stringify(['Parking', 'Beach Access', 'Equipment Rental', 'Snack Bar']),
        openingHours: JSON.stringify({
          monday: { open: '09:00', close: '21:00' },
          tuesday: { open: '09:00', close: '21:00' },
          wednesday: { open: '09:00', close: '21:00' },
          thursday: { open: '09:00', close: '21:00' },
          friday: { open: '09:00', close: '21:00' },
          saturday: { open: '10:00', close: '19:00' },
          sunday: { open: '10:00', close: '19:00' }
        }),
      },
      {
        id: uuidv4(),
        name: 'Pending Basketball Arena',
        description: 'New basketball facility awaiting approval.',
        location: 'North District',
        address: '789 North St, North District, City',
        latitude: 40.7500,
        longitude: -73.9500,
        ownerId: mikeUser.id,
        isApproved: 0,
        isActive: 1,
        rating: 0,
        totalRatings: 0,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'
        ]),
        amenities: JSON.stringify(['Parking', 'Equipment Rental']),
        openingHours: JSON.stringify({
          monday: { open: '09:00', close: '21:00' },
          tuesday: { open: '09:00', close: '21:00' },
          wednesday: { open: '09:00', close: '21:00' },
          thursday: { open: '09:00', close: '21:00' },
          friday: { open: '09:00', close: '21:00' },
          saturday: { open: '10:00', close: '18:00' },
          sunday: { open: '10:00', close: '18:00' }
        }),
      },
      {
        id: uuidv4(),
        name: 'New Tennis Center',
        description: 'Modern tennis center with multiple courts.',
        location: 'East Side',
        address: '456 East Ave, East Side, City',
        latitude: 40.7600,
        longitude: -73.9700,
        ownerId: ownerUser.id,
        isApproved: 0,
        isActive: 1,
        rating: 0,
        totalRatings: 0,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'
        ]),
        amenities: JSON.stringify(['Parking', 'Pro Shop', 'Café']),
        openingHours: JSON.stringify({
          monday: { open: '07:00', close: '22:00' },
          tuesday: { open: '07:00', close: '22:00' },
          wednesday: { open: '07:00', close: '22:00' },
          thursday: { open: '07:00', close: '22:00' },
          friday: { open: '07:00', close: '22:00' },
          saturday: { open: '08:00', close: '20:00' },
          sunday: { open: '08:00', close: '20:00' }
        }),
      },
    ];

    for (const venue of venues) {
      await db.run(
        `INSERT OR IGNORE INTO venues (
          id, name, description, location, address, latitude, longitude, 
          ownerId, isApproved, isActive, rating, totalRatings, images, 
          amenities, openingHours, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`,
        [
          venue.id, venue.name, venue.description, venue.location, venue.address,
          venue.latitude, venue.longitude, venue.ownerId, venue.isApproved,
          venue.isActive, venue.rating, venue.totalRatings, venue.images,
          venue.amenities, venue.openingHours
        ]
      );
    }

    // Get venue IDs
    const downtownVenue = await db.get('SELECT id FROM venues WHERE name = ?', ['Downtown Sports Center']);
    const tennisVenue = await db.get('SELECT id FROM venues WHERE name = ?', ['Riverside Tennis Club']);
    const badmintonVenue = await db.get('SELECT id FROM venues WHERE name = ?', ['Community Badminton Center']);
    const soccerVenue = await db.get('SELECT id FROM venues WHERE name = ?', ['Elite Soccer Complex']);
    const volleyballVenue = await db.get('SELECT id FROM venues WHERE name = ?', ['Volleyball Arena']);

    // Create courts
    const courts = [
      {
        id: uuidv4(),
        venueId: downtownVenue.id,
        name: 'Court 1',
        sportId: basketballSport.id,
        description: 'Professional basketball court with wooden flooring',
        pricePerHour: 25,
        isActive: 1,
      },
      {
        id: uuidv4(),
        venueId: downtownVenue.id,
        name: 'Court 2',
        sportId: basketballSport.id,
        description: 'Professional basketball court with wooden flooring',
        pricePerHour: 25,
        isActive: 1,
      },
      {
        id: uuidv4(),
        venueId: downtownVenue.id,
        name: 'Table Tennis Room 1',
        sportId: tableTennisSport.id,
        description: 'Air-conditioned table tennis room with 2 tables',
        pricePerHour: 15,
        isActive: 1,
      },
      {
        id: uuidv4(),
        venueId: downtownVenue.id,
        name: 'Table Tennis Room 2',
        sportId: tableTennisSport.id,
        description: 'Air-conditioned table tennis room with 2 tables',
        pricePerHour: 15,
        isActive: 1,
      },
      {
        id: uuidv4(),
        venueId: tennisVenue.id,
        name: 'Tennis Court 1',
        sportId: tennisSport.id,
        description: 'Professional tennis court with clay surface',
        pricePerHour: 40,
        isActive: 1,
      },
      {
        id: uuidv4(),
        venueId: tennisVenue.id,
        name: 'Tennis Court 2',
        sportId: tennisSport.id,
        description: 'Professional tennis court with hard surface',
        pricePerHour: 35,
        isActive: 1,
      },
      {
        id: uuidv4(),
        venueId: tennisVenue.id,
        name: 'Tennis Court 3',
        sportId: tennisSport.id,
        description: 'Professional tennis court with grass surface',
        pricePerHour: 45,
        isActive: 1,
      },
      {
        id: uuidv4(),
        venueId: badmintonVenue.id,
        name: 'Badminton Court 1',
        sportId: badmintonSport.id,
        description: 'Standard badminton court',
        pricePerHour: 15,
        isActive: 1,
      },
      {
        id: uuidv4(),
        venueId: badmintonVenue.id,
        name: 'Badminton Court 2',
        sportId: badmintonSport.id,
        description: 'Standard badminton court',
        pricePerHour: 15,
        isActive: 1,
      },
      {
        id: uuidv4(),
        venueId: badmintonVenue.id,
        name: 'Badminton Court 3',
        sportId: badmintonSport.id,
        description: 'Premium badminton court with wooden flooring',
        pricePerHour: 20,
        isActive: 1,
      },
      {
        id: uuidv4(),
        venueId: soccerVenue.id,
        name: 'Soccer Field 1',
        sportId: soccerSport.id,
        description: 'Professional soccer field with natural grass',
        pricePerHour: 60,
        isActive: 1,
      },
      {
        id: uuidv4(),
        venueId: soccerVenue.id,
        name: 'Soccer Field 2',
        sportId: soccerSport.id,
        description: 'Professional soccer field with artificial turf',
        pricePerHour: 50,
        isActive: 1,
      },
      {
        id: uuidv4(),
        venueId: volleyballVenue.id,
        name: 'Indoor Court 1',
        sportId: volleyballSport.id,
        description: 'Indoor volleyball court with sand surface',
        pricePerHour: 30,
        isActive: 1,
      },
      {
        id: uuidv4(),
        venueId: volleyballVenue.id,
        name: 'Outdoor Court 1',
        sportId: volleyballSport.id,
        description: 'Outdoor beach volleyball court',
        pricePerHour: 25,
        isActive: 1,
      },
    ];

    for (const court of courts) {
      await db.run(
        `INSERT OR IGNORE INTO courts (
          id, venueId, name, sportId, description, pricePerHour, isActive, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))`,
        [court.id, court.venueId, court.name, court.sportId, court.description, court.pricePerHour, court.isActive]
      );
    }

    // Get court IDs for bookings and time slots
    const court1 = await db.get('SELECT id FROM courts WHERE name = ? AND venueId = ?', ['Court 1', downtownVenue.id]);
    const court2 = await db.get('SELECT id FROM courts WHERE name = ? AND venueId = ?', ['Court 2', downtownVenue.id]);
    const court3 = await db.get('SELECT id FROM courts WHERE name = ? AND venueId = ?', ['Table Tennis Room 1', downtownVenue.id]);
    const tennisCourt1 = await db.get('SELECT id FROM courts WHERE name = ? AND venueId = ?', ['Tennis Court 1', tennisVenue.id]);
    const tennisCourt2 = await db.get('SELECT id FROM courts WHERE name = ? AND venueId = ?', ['Tennis Court 2', tennisVenue.id]);
    const badmintonCourt1 = await db.get('SELECT id FROM courts WHERE name = ? AND venueId = ?', ['Badminton Court 1', badmintonVenue.id]);
    const badmintonCourt2 = await db.get('SELECT id FROM courts WHERE name = ? AND venueId = ?', ['Badminton Court 2', badmintonVenue.id]);
    const badmintonCourt3 = await db.get('SELECT id FROM courts WHERE name = ? AND venueId = ?', ['Badminton Court 3', badmintonVenue.id]);
    const soccerCourt1 = await db.get('SELECT id FROM courts WHERE name = ? AND venueId = ?', ['Soccer Field 1', soccerVenue.id]);
    const soccerCourt2 = await db.get('SELECT id FROM courts WHERE name = ? AND venueId = ?', ['Soccer Field 2', soccerVenue.id]);
    const volleyballCourt1 = await db.get('SELECT id FROM courts WHERE name = ? AND venueId = ?', ['Indoor Court 1', volleyballVenue.id]);
    const volleyballCourt2 = await db.get('SELECT id FROM courts WHERE name = ? AND venueId = ?', ['Outdoor Court 1', volleyballVenue.id]);
    const tableTennisCourt1 = await db.get('SELECT id FROM courts WHERE name = ? AND venueId = ?', ['Table Tennis Room 1', downtownVenue.id]);
    const tableTennisCourt2 = await db.get('SELECT id FROM courts WHERE name = ? AND venueId = ?', ['Table Tennis Room 2', downtownVenue.id]);

    // Create bookings with realistic dates (today and future)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    
    const bookings = [
      {
        id: uuidv4(),
        userId: regularUser.id,
        courtId: court1.id,
        date: format(today, 'yyyy-MM-dd'),
        totalAmount: 50,
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentMethod: 'card',
        notes: 'Basketball game with friends',
        slots: [
          { startTime: '10:00', endTime: '12:00', duration: 120, slotAmount: 50 }
        ]
      },
      {
        id: uuidv4(),
        userId: johnUser.id,
        courtId: tennisCourt1.id,
        date: format(tomorrow, 'yyyy-MM-dd'),
        totalAmount: 80,
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentMethod: 'card',
        notes: 'Tennis lesson',
        slots: [
          { startTime: '14:00', endTime: '16:00', duration: 120, slotAmount: 80 }
        ]
      },
      {
        id: uuidv4(),
        userId: sarahUser.id,
        courtId: badmintonCourt1.id,
        date: format(dayAfterTomorrow, 'yyyy-MM-dd'),
        totalAmount: 15,
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentMethod: 'card',
        notes: 'Badminton practice',
        slots: [
          { startTime: '18:00', endTime: '19:00', duration: 60, slotAmount: 15 }
        ]
      },
      {
        id: uuidv4(),
        userId: regularUser.id,
        courtId: court1.id,
        date: format(tomorrow, 'yyyy-MM-dd'),
        totalAmount: 50,
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentMethod: 'card',
        notes: 'Weekend basketball game',
        slots: [
          { startTime: '16:00', endTime: '18:00', duration: 120, slotAmount: 50 }
        ]
      },
    ];

    for (const booking of bookings) {
      // Create booking record
      await db.run(
        `INSERT OR IGNORE INTO bookings (
          id, userId, courtId, date, totalAmount,
          status, paymentStatus, paymentMethod, notes, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`,
        [
          booking.id, booking.userId, booking.courtId, booking.date, booking.totalAmount,
          booking.status, booking.paymentStatus, booking.paymentMethod, booking.notes
        ]
      );

      // Create booking slots
      for (const slot of booking.slots) {
        const slotId = uuidv4();
        await db.run(
          `INSERT OR IGNORE INTO bookingSlots (
            id, bookingId, startTime, endTime, duration, slotAmount, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))`,
          [slotId, booking.id, slot.startTime, slot.endTime, slot.duration, slot.slotAmount]
        );
      }
    }

    // Create reviews
    const reviews = [
      {
        id: uuidv4(),
        userId: regularUser.id,
        venueId: downtownVenue.id,
        bookingId: bookings[0].id,
        rating: 5,
        comment: 'Excellent basketball court! Great facilities and friendly staff.',
        isVerified: 1,
      },
      {
        id: uuidv4(),
        userId: johnUser.id,
        venueId: tennisVenue.id,
        bookingId: bookings[1].id,
        rating: 4,
        comment: 'Good tennis courts. The clay surface is well maintained.',
        isVerified: 1,
      },
      {
        id: uuidv4(),
        userId: sarahUser.id,
        venueId: badmintonVenue.id,
        bookingId: bookings[2].id,
        rating: 4,
        comment: 'Nice badminton facility. Courts are clean and well-lit.',
        isVerified: 1,
      },
    ];

    for (const review of reviews) {
      await db.run(
        `INSERT OR IGNORE INTO reviews (
          id, userId, venueId, bookingId, rating, comment, isVerified, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))`,
        [review.id, review.userId, review.venueId, review.bookingId, review.rating, review.comment, review.isVerified]
      );
    }

    // Create teams
    const teams = [
      {
        id: uuidv4(),
        name: 'Downtown Dunkers',
        captainId: regularUser.id,
        description: 'Basketball team for casual players',
        logo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100',
        isActive: 1,
      },
      {
        id: uuidv4(),
        name: 'Riverside Racers',
        captainId: johnUser.id,
        description: 'Tennis enthusiasts group',
        logo: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=100',
        isActive: 1,
      },
    ];

    for (const team of teams) {
      await db.run(
        `INSERT OR IGNORE INTO teams (
          id, name, captainId, description, logo, isActive, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))`,
        [team.id, team.name, team.captainId, team.description, team.logo, team.isActive]
      );
    }

    // Get team IDs
    const dunkersTeam = await db.get('SELECT id FROM teams WHERE name = ?', ['Downtown Dunkers']);
    const racersTeam = await db.get('SELECT id FROM teams WHERE name = ?', ['Riverside Racers']);

    // Create team members
    const teamMembers = [
      {
        id: uuidv4(),
        teamId: dunkersTeam.id,
        userId: regularUser.id,
        role: 'captain',
      },
      {
        id: uuidv4(),
        teamId: dunkersTeam.id,
        userId: johnUser.id,
        role: 'member',
      },
      {
        id: uuidv4(),
        teamId: racersTeam.id,
        userId: johnUser.id,
        role: 'captain',
      },
      {
        id: uuidv4(),
        teamId: racersTeam.id,
        userId: sarahUser.id,
        role: 'member',
      },
    ];

    for (const member of teamMembers) {
      await db.run(
        `INSERT OR IGNORE INTO teamMembers (
          id, teamId, userId, role, joinedAt
        ) VALUES (?, ?, ?, ?, datetime("now"))`,
        [member.id, member.teamId, member.userId, member.role]
      );
    }

    // Create notifications
    const notifications = [
      {
        id: uuidv4(),
        userId: regularUser.id,
        title: 'Booking Confirmed',
        message: 'Your basketball court booking for Jan 15th has been confirmed.',
        type: 'booking',
        isRead: 0,
      },
      {
        id: uuidv4(),
        userId: johnUser.id,
        title: 'New Review',
        message: 'Someone left a review for your tennis court booking.',
        type: 'review',
        isRead: 0,
      },
      {
        id: uuidv4(),
        userId: sarahUser.id,
        title: 'Payment Successful',
        message: 'Payment for your badminton court booking has been processed.',
        type: 'payment',
        isRead: 1,
      },
    ];

    for (const notification of notifications) {
      await db.run(
        `INSERT OR IGNORE INTO notifications (
          id, userId, title, message, type, isRead, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))`,
        [notification.id, notification.userId, notification.title, notification.message, notification.type, notification.isRead]
      );
    }

    // Create comprehensive time slots for all courts and days
    const timeSlots = [];
    
    // Generate time slots for each court (6:00 AM to 10:00 PM, 1-hour slots)
    const allCourts = [court1, court2, court3, tennisCourt1, tennisCourt2, badmintonCourt1, badmintonCourt2, badmintonCourt3, soccerCourt1, soccerCourt2, volleyballCourt1, volleyballCourt2, tableTennisCourt1, tableTennisCourt2];
    
    for (const court of allCourts) {
      for (let day = 0; day < 7; day++) { // 0 = Sunday, 1 = Monday, etc.
        for (let hour = 6; hour < 22; hour++) { // 6 AM to 10 PM
          const startTime = `${hour.toString().padStart(2, '0')}:00`;
          const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
          
          timeSlots.push({
            id: uuidv4(),
            courtId: court.id,
            startTime,
            endTime,
            dayOfWeek: day,
            isAvailable: 1,
            isMaintenance: 0,
          });
        }
      }
    }

    for (const slot of timeSlots) {
      await db.run(
        `INSERT OR IGNORE INTO timeSlots (
          id, courtId, startTime, endTime, dayOfWeek, isAvailable, isMaintenance, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))`,
        [slot.id, slot.courtId, slot.startTime, slot.endTime, slot.dayOfWeek, slot.isAvailable, slot.isMaintenance]
      );
    }

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Sample Data Created:');
    console.log('- 8 Sports (Basketball, Tennis, Badminton, Soccer, Volleyball, Table Tennis, Cricket, Swimming)');
    console.log('- 6 Users (Admin, Owner, Regular User, John, Sarah, Mike)');
    console.log('- 5 Venues (Downtown Sports Center, Riverside Tennis Club, Community Badminton Center, Elite Soccer Complex, Volleyball Arena)');
    console.log('- 15 Courts across the venues');
    console.log('- 4 Bookings with multiple time slots');
    console.log('- 3 Reviews for venues');
    console.log('- 2 Teams with members');
    console.log('- 3 Notifications');
    console.log('- 1680 Time slots (16 hours × 7 days × 15 courts)');
    console.log('\n🔑 Login Credentials:');
    console.log('Admin: admin@quickcourt.com / password123');
    console.log('Owner: owner@quickcourt.com / password123');
    console.log('User: user@quickcourt.com / password123');
    console.log('John: john@example.com / password123');
    console.log('Sarah: sarah@example.com / password123');
    console.log('Mike: mike@example.com / password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
