import express from 'express';
import { getDatabase } from '../database/init.js';

const router = express.Router();

// @desc    Get all sports
// @route   GET /api/sports
// @access  Public
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    
    const sports = await db.all(`
      SELECT * FROM sports 
      WHERE isActive = 1 
      ORDER BY name ASC
    `);

    res.json({
      success: true,
      data: sports
    });
  } catch (error) {
    console.error('Get sports error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get sport by ID
// @route   GET /api/sports/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    const sport = await db.get('SELECT * FROM sports WHERE id = ? AND isActive = 1', [id]);
    
    if (!sport) {
      return res.status(404).json({
        success: false,
        error: 'Sport not found'
      });
    }

    res.json({
      success: true,
      data: sport
    });
  } catch (error) {
    console.error('Get sport error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;
