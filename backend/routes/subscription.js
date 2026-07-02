const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Stripe configuration - ensure STRIPE_SECRET_KEY is set in environment variables
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// All routes require authentication
router.use(authenticateToken);

// Get subscription status
router.get('/status', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await db.query(
      `SELECT subscription_status, subscription_started_at, subscription_expires_at,
              stripe_customer_id, stripe_subscription_id
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];
    const now = new Date();
    const expiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
    const isActive = expiresAt && expiresAt > now;

    res.json({
      success: true,
      data: {
        subscription_status: user.subscription_status,
        is_active: isActive,
        started_at: user.subscription_started_at,
        expires_at: user.subscription_expires_at,
        stripe_customer_id: user.stripe_customer_id,
        stripe_subscription_id: user.stripe_subscription_id
      }
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription status'
    });
  }
});

// Create payment intent for subscription
router.post('/create-payment-intent', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { plan } = req.body; // 'monthly' or 'yearly'

    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan type'
      });
    }

    // Get user details
    const userResult = await db.query(
      'SELECT email, name, stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Pricing (in cents/smallest currency unit)
    const prices = {
      monthly: 999, // $9.99/month
      yearly: 9999  // $99.99/year (save ~17%)
    };

    let customerId = user.stripe_customer_id;

    // Create or retrieve Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          user_id: userId
        }
      });
      customerId = customer.id;

      // Save customer ID
      await db.query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [customerId, userId]
      );
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: prices[plan],
      currency: 'usd',
      customer: customerId,
      metadata: {
        user_id: userId,
        plan: plan,
        subscription_status: 'premium'
      },
      receipt_email: user.email,
      description: `Digital Coffee ${plan === 'monthly' ? 'Monthly' : 'Yearly'} Subscription`
    });

    // Log payment attempt
    await db.query(
      `INSERT INTO payment_logs (user_id, plan_type, amount, stripe_payment_intent_id, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, plan, prices[plan] / 100, paymentIntent.id, 'pending']
    );

    res.json({
      success: true,
      data: {
        client_secret: paymentIntent.client_secret,
        publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
        amount: prices[plan],
        plan: plan
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment intent',
      error: error.message
    });
  }
});

// Confirm subscription payment (called after successful payment)
router.post('/confirm-payment', async (req, res) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const userId = req.user.userId;
    const { payment_intent_id, plan } = req.body;

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status !== 'succeeded') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    // Calculate subscription period
    const startDate = new Date();
    const expiresDate = new Date();
    if (plan === 'monthly') {
      expiresDate.setMonth(expiresDate.getMonth() + 1);
    } else {
      expiresDate.setFullYear(expiresDate.getFullYear() + 1);
    }

    // Update user subscription
    await client.query(
      `UPDATE users
       SET subscription_status = 'premium',
           subscription_started_at = $1,
           subscription_expires_at = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [startDate, expiresDate, userId]
    );

    // Update payment log
    await client.query(
      `UPDATE payment_logs
       SET status = 'completed', completed_at = CURRENT_TIMESTAMP
       WHERE stripe_payment_intent_id = $1`,
      [payment_intent_id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Subscription activated successfully',
      data: {
        subscription_status: 'premium',
        expires_at: expiresDate
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming payment',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Cancel subscription
router.post('/cancel', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Update subscription to free (keep expires_at for grace period)
    await db.query(
      `UPDATE users
       SET subscription_status = 'free',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Subscription cancelled. You can still use premium features until the end of your billing period.'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription'
    });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('PaymentIntent succeeded:', paymentIntent.id);

        // Payment will be confirmed via /confirm-payment endpoint
        break;

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        console.log('PaymentIntent failed:', failedIntent.id);

        await db.query(
          `UPDATE payment_logs
           SET status = 'failed', error_message = $2
           WHERE stripe_payment_intent_id = $1`,
          [failedIntent.id, failedIntent.last_payment_error?.message || 'Payment failed']
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// Get subscription history/payments
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await db.query(
      `SELECT id, plan_type, amount, status, created_at, completed_at
       FROM payment_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get subscription history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription history'
    });
  }
});

module.exports = router;
