import { initializeDatabase } from './src/database/init.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const resetAndSeed = async () => {
  try {
    console.log('🗑️  Resetting database...');
    
    // Delete the database file
    const dbPath = join(__dirname, 'database/quickcourt.db');
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('✅ Database file deleted');
    }
    
    // Reinitialize database
    console.log('🔧 Reinitializing database...');
    await initializeDatabase();
    console.log('✅ Database reinitialized');
    
    // Run seed
    console.log('🌱 Running seed...');
    const { execSync } = await import('child_process');
    execSync('node src/database/seed.js', { stdio: 'inherit' });
    
    console.log('🎉 Database reset and seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetAndSeed();
