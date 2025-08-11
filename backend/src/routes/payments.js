import express from 'express';
import { getDatabase } from '../database/init.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get payment intent for booking
// @route   POST /api/payments/create-intent
// @access  Private
router.post('/create-intent', protect, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const db = getDatabase();

    // Get booking details
    const booking = await db.get(`
      SELECT b.*, c.name as courtName, v.name as venueName
      FROM bookings b
      LEFT JOIN courts c ON b.courtId = c.id
      LEFT JOIN venues v ON c.venueId = v.id
      WHERE b.id = ? AND b.userId = ?
    `, [bookingId, req.user.id]);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Booking is already paid'
      });
    }

    // For now, return a mock payment intent
    // In production, integrate with Stripe
    const paymentIntent = {
      id: `pi_${Math.random().toString(36).substr(2, 9)}`,
      amount: Math.round(booking.totalAmount * 100), // Convert to cents
      currency: 'usd',
      status: 'requires_payment_method',
      client_secret: `pi_${Math.random().toString(36).substr(2, 9)}_secret_${Math.random().toString(36).substr(2, 9)}`
    };

    res.json({
      success: true,
      data: {
        paymentIntent,
        booking
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private
router.post('/confirm', protect, async (req, res) => {
  try {
    const { bookingId, paymentIntentId } = req.body;
    const db = getDatabase();

    // Update booking payment status
    await db.run(`
      UPDATE bookings 
      SET paymentStatus = 'paid', stripePaymentIntentId = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ? AND userId = ?
    `, [paymentIntentId, bookingId, req.user.id]);

    // Create payment transaction record
    const booking = await db.get('SELECT totalAmount FROM bookings WHERE id = ?', [bookingId]);
    
    await db.run(`
      INSERT INTO paymentTransactions (id, bookingId, stripePaymentIntentId, amount, status, paymentMethod)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      `txn_${Math.random().toString(36).substr(2, 9)}`,
      bookingId,
      paymentIntentId,
      booking.totalAmount,
      'succeeded',
      'card'
    ]);

    res.json({
      success: true,
      message: 'Payment confirmed successfully'
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;
