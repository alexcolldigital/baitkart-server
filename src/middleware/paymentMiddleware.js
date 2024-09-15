const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/order');
const User = require('../models/user');

const paymentMiddleware = {
  validatePaymentIntent: async (req, res, next) => {
    try {
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ message: 'Payment intent ID is required' });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (!paymentIntent) {
        return res.status(404).json({ message: 'Payment intent not found' });
      }

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: 'Payment has not been completed' });
      }

      req.paymentIntent = paymentIntent;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Error validating payment intent', error: error.message });
    }
  },

  checkOrderTotal: async (req, res, next) => {
    try {
      const { orderId } = req.body;
      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order.total !== req.paymentIntent.amount / 100) {
        return res.status(400).json({ message: 'Payment amount does not match order total' });
      }

      req.order = order;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Error checking order total', error: error.message });
    }
  },

  verifyPaymentMethod: async (req, res, next) => {
    try {
      const { paymentMethodId } = req.body;

      if (!paymentMethodId) {
        return res.status(400).json({ message: 'Payment method ID is required' });
      }

      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

      if (!paymentMethod) {
        return res.status(404).json({ message: 'Payment method not found' });
      }

      req.paymentMethod = paymentMethod;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Error verifying payment method', error: error.message });
    }
  },

  checkFraudRisk: async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      // Implement your fraud detection logic here
      // This is a simple example and should be replaced with more robust fraud detection
      const isSuspicious = user.orders.length === 0 && req.paymentIntent.amount > 100000; // $1000

      if (isSuspicious) {
        return res.status(403).json({ message: 'This transaction has been flagged for review' });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Error checking fraud risk', error: error.message });
    }
  },

  createPaymentIntent: async (req, res, next) => {
    try {
      const { amount, currency, orderId } = req.body;

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        metadata: { orderId }
      });

      req.paymentIntent = paymentIntent;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Error creating payment intent', error: error.message });
    }
  },

  handleWebhook: async (req, res, next) => {
    const sig = req.headers['stripe-signature'];

    try {
      const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          // Handle successful payment
          break;
        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object;
          // Handle failed payment
          break;
        // ... handle other event types
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
};

module.exports = paymentMiddleware;
