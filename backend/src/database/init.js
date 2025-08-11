import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db;

export const getDatabase = () => db;

export const initializeDatabase = async () => {
  const dbPath = process.env.DATABASE_URL || join(__dirname, '../../database/quickcourt.db');
  
  // Ensure database directory exists
  const dbDir = dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await db.exec('PRAGMA foreign_keys = ON');

  // Create tables
  await createTables();

  // Run lightweight migrations for existing databases
  await runMigrations();
  
  return db;
};

const createTables = async () => {
  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      fullName TEXT NOT NULL,
      phone TEXT,
      role TEXT DEFAULT 'user' CHECK (role IN ('user', 'owner', 'admin')),
      isVerified INTEGER DEFAULT 0,
      isActive INTEGER DEFAULT 1,
      profileImage TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Venues table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS venues (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      location TEXT NOT NULL,
      address TEXT,
      latitude REAL,
      longitude REAL,
      ownerId TEXT NOT NULL,
      isApproved INTEGER DEFAULT 0,
      isActive INTEGER DEFAULT 1,
      rating REAL DEFAULT 0,
      totalRatings INTEGER DEFAULT 0,
      images TEXT, -- JSON array of image URLs
      amenities TEXT, -- JSON array of amenities
      openingHours TEXT, -- JSON object of opening hours
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ownerId) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Sports table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sports (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Courts table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS courts (
      id TEXT PRIMARY KEY,
      venueId TEXT NOT NULL,
      name TEXT NOT NULL,
      sportId TEXT NOT NULL,
      description TEXT,
      pricePerHour REAL NOT NULL,
      isActive INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (venueId) REFERENCES venues (id) ON DELETE CASCADE,
      FOREIGN KEY (sportId) REFERENCES sports (id) ON DELETE CASCADE
    )
  `);

  // Time slots table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS timeSlots (
      id TEXT PRIMARY KEY,
      courtId TEXT NOT NULL,
      startTime TEXT NOT NULL, -- Format: HH:MM
      endTime TEXT NOT NULL, -- Format: HH:MM
      dayOfWeek INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
      isAvailable INTEGER DEFAULT 1,
      isMaintenance INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (courtId) REFERENCES courts (id) ON DELETE CASCADE
    )
  `);

  // Bookings table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      courtId TEXT NOT NULL,
      date TEXT NOT NULL, -- Format: YYYY-MM-DD
      startTime TEXT NOT NULL, -- Format: HH:MM
      endTime TEXT NOT NULL, -- Format: HH:MM
      duration INTEGER NOT NULL, -- in minutes
      totalAmount REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
      paymentStatus TEXT DEFAULT 'pending' CHECK (paymentStatus IN ('pending', 'paid', 'refunded')),
      paymentMethod TEXT,
      stripePaymentIntentId TEXT,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (courtId) REFERENCES courts (id) ON DELETE CASCADE
    )
  `);

  // Reviews table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      venueId TEXT NOT NULL,
      bookingId TEXT,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      isVerified INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (venueId) REFERENCES venues (id) ON DELETE CASCADE,
      FOREIGN KEY (bookingId) REFERENCES bookings (id) ON DELETE SET NULL
    )
  `);

  // Notifications table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
      isRead INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Payment transactions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS paymentTransactions (
      id TEXT PRIMARY KEY,
      bookingId TEXT NOT NULL,
      stripePaymentIntentId TEXT UNIQUE,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      status TEXT NOT NULL,
      paymentMethod TEXT,
      metadata TEXT, -- JSON object for additional data
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bookingId) REFERENCES bookings (id) ON DELETE CASCADE
    )
  `);

  // Teams table (for group bookings)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      captainId TEXT NOT NULL,
      description TEXT,
      logo TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (captainId) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Team members table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS teamMembers (
      id TEXT PRIMARY KEY,
      teamId TEXT NOT NULL,
      userId TEXT NOT NULL,
      role TEXT DEFAULT 'member' CHECK (role IN ('captain', 'member')),
      joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teamId) REFERENCES teams (id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(teamId, userId)
    )
  `);

  // Insert default sports
  await insertDefaultSports();
};

// Lightweight migrations to evolve existing databases without full reset
const runMigrations = async () => {
  // Helper to add a column if it is missing
  const addColumnIfMissing = async (tableName, columnName, columnDefinition) => {
    const columns = await db.all(`PRAGMA table_info(${tableName})`);
    const hasColumn = columns.some(col => col.name === columnName);
    if (!hasColumn) {
      await db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
    }
  };

  // Ensure timeSlots has isMaintenance column
  await addColumnIfMissing('timeSlots', 'isMaintenance', 'INTEGER DEFAULT 0');
};

const insertDefaultSports = async () => {
  const sports = [
    { id: 'badminton', name: 'Badminton', description: 'Indoor racket sport', icon: '🏸' },
    { id: 'tennis', name: 'Tennis', description: 'Outdoor racket sport', icon: '🎾' },
    { id: 'football', name: 'Football', description: 'Team sport on turf', icon: '⚽' },
    { id: 'basketball', name: 'Basketball', description: 'Team sport with hoops', icon: '🏀' },
    { id: 'table-tennis', name: 'Table Tennis', description: 'Indoor table sport', icon: '🏓' },
    { id: 'cricket', name: 'Cricket', description: 'Bat and ball sport', icon: '🏏' },
    { id: 'volleyball', name: 'Volleyball', description: 'Team sport with net', icon: '🏐' },
    { id: 'squash', name: 'Squash', description: 'Indoor racket sport', icon: '🎾' }
  ];

  for (const sport of sports) {
    await db.run(`
      INSERT OR IGNORE INTO sports (id, name, description, icon)
      VALUES (?, ?, ?, ?)
    `, [sport.id, sport.name, sport.description, sport.icon]);
  }
};
