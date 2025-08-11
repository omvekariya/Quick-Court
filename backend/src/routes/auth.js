import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../database/init.js';
import { generateToken } from '../utils/generateToken.js';
import { protect } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

const router = express.Router();

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || "omvekariya31@gmail.com",
    pass: process.env.EMAIL_PASS || "npft wdnv pmlj hwun",
  },
});


// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map();

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, purpose) => {
  const subject = purpose === 'verification' ? 'Verify Your Email - QuickCourt' : 'Reset Your Password - QuickCourt';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">QuickCourt</h2>
      <p>Your verification code is:</p>
      <h1 style="color: #007bff; font-size: 48px; letter-spacing: 8px; text-align: center; margin: 30px 0;">${otp}</h1>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html,
  });
};

// @desc    Send OTP for email verification
// @route   POST /api/auth/send-otp
// @access  Public
router.post('/send-otp', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('purpose').isIn(['verification', 'reset']).withMessage('Invalid purpose')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { email, purpose } = req.body;
    const db = getDatabase();

    if (purpose === 'verification') {
      // Check if user already exists
      const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User already exists with this email'
        });
      }
    } else if (purpose === 'reset') {
      // Check if user exists
      const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
      if (!existingUser) {
        return res.status(400).json({
          success: false,
          error: 'No user found with this email'
        });
      }
    }

    // Generate and store OTP
    const otp = generateOTP();
    const otpKey = `${email}_${purpose}`;
    otpStore.set(otpKey, {
      otp,
      timestamp: Date.now(),
      attempts: 0,
      verified: false
    });

    console.log('OTP sent and stored:', {
      email,
      purpose,
      otpKey,
      otp,
      timestamp: Date.now()
    });

    // Send OTP email
    await sendOTPEmail(email, otp, purpose);

    res.json({
      success: true,
      message: `OTP sent to ${email}`
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP'
    });
  }
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('purpose').isIn(['verification', 'reset']).withMessage('Invalid purpose')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { email, otp, purpose } = req.body;
    const otpKey = `${email}_${purpose}`;
    const storedOTP = otpStore.get(otpKey);

    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        error: 'OTP expired or not found'
      });
    }

    // Check if OTP is expired (10 minutes)
    if (Date.now() - storedOTP.timestamp > 10 * 60 * 1000) {
      otpStore.delete(otpKey);
      return res.status(400).json({
        success: false,
        error: 'OTP expired'
      });
    }

    // Check attempts
    if (storedOTP.attempts >= 3) {
      otpStore.delete(otpKey);
      return res.status(400).json({
        success: false,
        error: 'Too many attempts. Please request a new OTP'
      });
    }

    // Verify OTP
    if (storedOTP.otp !== otp) {
      storedOTP.attempts += 1;
      otpStore.set(otpKey, storedOTP);
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP'
      });
    }

    // For verification purpose, mark OTP as verified but don't delete yet
    // For reset purpose, we can delete immediately
    if (purpose === 'reset') {
      otpStore.delete(otpKey);
    } else {
      // Mark as verified for registration
      storedOTP.verified = true;
      otpStore.set(otpKey, storedOTP);
    }

    console.log('OTP verification successful:', {
      email,
      purpose,
      otpKey,
      verified: purpose === 'verification' ? storedOTP.verified : 'deleted'
    });

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP'
    });
  }
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
  body('role').isIn(['user', 'owner']).withMessage('Role must be either user or owner'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { email, password, fullName, phone, role, otp } = req.body;
    const db = getDatabase();

    // Verify OTP first
    const otpKey = `${email}_verification`;
    const storedOTP = otpStore.get(otpKey);

    console.log('Registration OTP check:', {
      email,
      otpKey,
      storedOTP: storedOTP ? {
        otp: storedOTP.otp,
        verified: storedOTP.verified,
        timestamp: storedOTP.timestamp,
        attempts: storedOTP.attempts
      } : null,
      providedOTP: otp
    });

    if (!storedOTP || storedOTP.otp !== otp || !storedOTP.verified) {
      return res.status(400).json({
        success: false,
        error: 'Invalid, expired, or unverified OTP. Please verify your OTP first.'
      });
    }

    // Check if user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const userId = uuidv4();
    await db.run(`
      INSERT INTO users (id, email, password, fullName, phone, role, isVerified)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `, [userId, email, hashedPassword, fullName, phone || null, role]);

    // Remove OTP from store
    otpStore.delete(otpKey);

    // Get created user (without password)
    const user = await db.get('SELECT id, email, fullName, phone, role, isVerified, createdAt FROM users WHERE id = ?', [userId]);

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { email, password } = req.body;
    const db = getDatabase();

    // Check for user
    const user = await db.get('SELECT * FROM users WHERE email = ? AND isActive = 1', [email]);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { email, otp, newPassword } = req.body;
    const db = getDatabase();

    // Verify OTP
    const otpKey = `${email}_reset`;
    const storedOTP = otpStore.get(otpKey);

    if (!storedOTP || storedOTP.otp !== otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP'
      });
    }

    // Get user
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'User not found'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await db.run(`
      UPDATE users 
      SET password = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [hashedPassword, user.id]);

    // Remove OTP from store
    otpStore.delete(otpKey);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const db = getDatabase();
    const user = await db.get('SELECT id, email, fullName, phone, role, isVerified, profileImage, createdAt FROM users WHERE id = ?', [req.user.id]);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, [
  body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { fullName, phone } = req.body;
    const db = getDatabase();

    // Update user
    const updateFields = [];
    const updateValues = [];

    if (fullName) {
      updateFields.push('fullName = ?');
      updateValues.push(fullName);
    }

    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    updateFields.push('updatedAt = CURRENT_TIMESTAMP');
    updateValues.push(req.user.id);

    await db.run(`
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    // Get updated user
    const user = await db.get('SELECT id, email, fullName, phone, role, isVerified, profileImage, createdAt FROM users WHERE id = ?', [req.user.id]);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { currentPassword, newPassword } = req.body;
    const db = getDatabase();

    // Get user with password
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await db.run(`
      UPDATE users 
      SET password = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [hashedPassword, req.user.id]);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;
