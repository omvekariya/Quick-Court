import express from 'express';
import { getDatabase } from '../database/init.js';
import { protect, authorize } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// @desc    Get all teams
// @route   GET /api/teams
// @access  Public
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    
    const teams = await db.all(`
      SELECT t.*, 
             COUNT(tm.id) as memberCount,
             u.fullName as ownerName
      FROM teams t
      LEFT JOIN teamMembers tm ON t.id = tm.teamId
      LEFT JOIN users u ON t.ownerId = u.id
      WHERE t.isActive = 1
      GROUP BY t.id
      ORDER BY t.createdAt DESC
    `);

    res.json({
      success: true,
      data: teams
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get team by ID
// @route   GET /api/teams/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    const team = await db.get(`
      SELECT t.*, u.fullName as ownerName
      FROM teams t
      LEFT JOIN users u ON t.ownerId = u.id
      WHERE t.id = ? AND t.isActive = 1
    `, [id]);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    // Get team members
    const members = await db.all(`
      SELECT tm.*, u.fullName, u.email, u.profileImage
      FROM teamMembers tm
      JOIN users u ON tm.userId = u.id
      WHERE tm.teamId = ?
      ORDER BY tm.role, u.fullName
    `, [id]);

    res.json({
      success: true,
      data: {
        ...team,
        members
      }
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Create team
// @route   POST /api/teams
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, logo } = req.body;
    const db = getDatabase();

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Team name is required'
      });
    }

    const teamId = uuidv4();
    
    await db.run(`
      INSERT INTO teams (id, name, description, logo, ownerId, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [teamId, name, description || '', logo || '', req.user.id]);

    // Add owner as first member
    await db.run(`
      INSERT INTO teamMembers (id, teamId, userId, role, joinedAt)
      VALUES (?, ?, ?, 'owner', CURRENT_TIMESTAMP)
    `, [uuidv4(), teamId, req.user.id]);

    const newTeam = await db.get('SELECT * FROM teams WHERE id = ?', [teamId]);

    res.status(201).json({
      success: true,
      data: newTeam
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private (Team owner)
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, logo } = req.body;
    const db = getDatabase();

    // Check if team exists and user is owner
    const team = await db.get('SELECT * FROM teams WHERE id = ?', [id]);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    if (team.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this team'
      });
    }

    await db.run(`
      UPDATE teams 
      SET name = ?, description = ?, logo = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, description, logo, id]);

    const updatedTeam = await db.get('SELECT * FROM teams WHERE id = ?', [id]);

    res.json({
      success: true,
      data: updatedTeam
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Add member to team
// @route   POST /api/teams/:id/members
// @access  Private (Team owner)
router.post('/:id/members', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role = 'member' } = req.body;
    const db = getDatabase();

    // Check if team exists and user is owner
    const team = await db.get('SELECT * FROM teams WHERE id = ?', [id]);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    if (team.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to add members to this team'
      });
    }

    // Check if user exists
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is already a member
    const existingMember = await db.get('SELECT * FROM teamMembers WHERE teamId = ? AND userId = ?', [id, userId]);
    if (existingMember) {
      return res.status(400).json({
        success: false,
        error: 'User is already a member of this team'
      });
    }

    await db.run(`
      INSERT INTO teamMembers (id, teamId, userId, role, joinedAt)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [uuidv4(), id, userId, role]);

    res.status(201).json({
      success: true,
      message: 'Member added successfully'
    });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Remove member from team
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private (Team owner)
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const { id, userId } = req.params;
    const db = getDatabase();

    // Check if team exists and user is owner
    const team = await db.get('SELECT * FROM teams WHERE id = ?', [id]);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    if (team.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to remove members from this team'
      });
    }

    // Check if member exists
    const member = await db.get('SELECT * FROM teamMembers WHERE teamId = ? AND userId = ?', [id, userId]);
    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    // Don't allow removing the owner
    if (member.role === 'owner') {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove team owner'
      });
    }

    await db.run('DELETE FROM teamMembers WHERE teamId = ? AND userId = ?', [id, userId]);

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;
