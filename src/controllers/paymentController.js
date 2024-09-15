const axios = require('axios');
const crypto = require('crypto');
const Order = require('../models/order');
const User = require('../models/user');

// Load environment variables
require('dotenv').config();

const paymentController = {
  // Initialize Paystack payment
  initializePaystackPayment: async (req, res) => {
    try {
      const { amount, email, orderId } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const response = await axios.post('https://api.paystack.co/transaction/initialize', {
        amount: amount * 100, // Paystack expects amount in kobo
        email,
        reference: orderId
      }, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      res.json(response.data);
    } catch (error) {
      res.status(500).json({ message: "Error initializing Paystack payment", error: error.message });
    }
  },

  // Verify Paystack payment
  verifyPaystackPayment: async (req, res) => {
    try {
      const { reference } = req.query;

      const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      });

      if (response.data.data.status === 'success') {
        const order = await Order.findByIdAndUpdate(reference, 
          { status: 'paid', paymentId: response.data.data.id },
          { new: true }
        );

        res.json({ message: "Payment verified successfully", order });
      } else {
        res.status(400).json({ message: "Payment verification failed" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error verifying Paystack payment", error: error.message });
    }
  },

  // Create Coinbase charge
  createCoinbaseCharge: async (req, res) => {
    try {
      const { amount, currency, orderId } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const response = await axios.post('https://api.commerce.coinbase.com/charges', {
        name: `Order ${orderId}`,
        description: `Payment for order ${orderId}`,
        pricing_type: 'fixed_price',
        local_price: {
          amount: amount.toString(),
          currency: currency
        },
        metadata: {
          orderId: orderId
        }
      }, {
        headers: {
          'X-CC-Api-Key': process.env.COINBASE_API_KEY,
          'X-CC-Version': '2018-03-22',
          'Content-Type': 'application/json'
        }
      });

      res.json(response.data);
    } catch (error) {
      res.status(500).json({ message: "Error creating Coinbase charge", error: error.message });
    }
  },

  // Handle Coinbase webhook
  handleCoinbaseWebhook: async (req, res) => {
    try {
      const rawBody = JSON.stringify(req.body);
      const signature = req.headers['x-cc-webhook-signature'];

      const hmac = crypto.createHmac('sha256', process.env.COINBASE_WEBHOOK_SECRET);
      hmac.update(rawBody);
      const computedSignature = hmac.digest('hex');

      if (computedSignature !== signature) {
        return res.status(401).json({ message: "Invalid signature" });
      }

      const event = req.body;

      if (event.type === 'charge:confirmed') {
        const orderId = event.data.metadata.orderId;
        await Order.findByIdAndUpdate(orderId, 
          { status: 'paid', paymentId: event.data.id },
          { new: true }
        );
      }

      res.sendStatus(200);
    } catch (error) {
      res.status(500).json({ message: "Error handling Coinbase webhook", error: error.message });
    }
  },

  // Process refund (Paystack example)
  processRefund: async (req, res) => {
    try {
      const { orderId, amount } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.status !== 'paid') {
        return res.status(400).json({ message: "Order is not eligible for refund" });
      }

      const response = await axios.post('https://api.paystack.co/refund', {
        transaction: order.paymentId,
        amount: amount * 100 // Paystack expects amount in kobo
      }, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status) {
        order.status = 'refunded';
        await order.save();

        res.json({ message: "Refund processed successfully", refund: response.data.data });
      } else {
        res.status(400).json({ message: "Refund processing failed" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error processing refund", error: error.message });
    }
  }
};

module.exports = paymentController;
