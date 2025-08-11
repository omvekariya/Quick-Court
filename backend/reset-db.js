import { initializeDatabase } from './src/database/init.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const resetDatabase = async () => {
  try {
    const dbPath = process.env.DATABASE_URL || join(__dirname, 'database/quickcourt.db');
    
    // Delete existing database file if it exists
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('🗑️  Deleted existing database file');
    }
    
    // Initialize new database
    await initializeDatabase();
    console.log('✅ Database reset successfully!');
    console.log('📁 New database created at:', dbPath);
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
};

resetDatabase();
