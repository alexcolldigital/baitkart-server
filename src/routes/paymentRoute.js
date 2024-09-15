const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const paymentMiddleware = require('../middleware/paymentMiddleware');

// Middleware to ensure the user is authenticated
router.use(authMiddleware);

// Create payment intent
router.post('/create-payment-intent', paymentController.createPaymentIntent);

// Confirm payment
router.post('/confirm-payment', paymentMiddleware.validatePaymentIntent, paymentController.confirmPayment);

// Get payment details
router.get('/payment/:paymentId', paymentController.getPaymentDetails);

// List user's payments
router.get('/user-payments', paymentController.getUserPayments);

// Request refund

// Get refund status
router.get('/refund/:refundId', paymentController.getRefundStatus);

// Add payment method
router.post('/add-payment-method', paymentController.addPaymentMethod);

// Remove payment method
router.delete('/remove-payment-method/:paymentMethodId', paymentController.removePaymentMethod);

// List payment methods
router.get('/payment-methods', paymentController.listPaymentMethods);

// Set default payment method
router.post('/set-default-payment-method', paymentController.setDefaultPaymentMethod);

// Create customer (for saving payment methods)
router.post('/create-customer', paymentController.createCustomer);

// Update customer
router.put('/update-customer', paymentController.updateCustomer);

// Get customer details
router.get('/customer', paymentController.getCustomerDetails);

// Create subscription
router.post('/create-subscription', paymentController.createSubscription);

// Cancel subscription
router.post('/cancel-subscription', paymentController.cancelSubscription);

// Update subscription
router.put('/update-subscription', paymentController.updateSubscription);

// Get subscription details
router.get('/subscription/:subscriptionId', paymentController.getSubscriptionDetails);

// List subscriptions
router.get('/subscriptions', paymentController.listSubscriptions);

// Create invoice
router.post('/create-invoice', paymentController.createInvoice);

// Pay invoice
router.post('/pay-invoice/:invoiceId', paymentController.payInvoice);

// Get invoice details
router.get('/invoice/:invoiceId', paymentController.getInvoiceDetails);

// List invoices
router.get('/invoices', paymentController.listInvoices);

// Webhook handler for payment events
router.post('/webhook', paymentMiddleware.verifyWebhookSignature, paymentController.handleWebhook);

// Get payment statistics
router.get('/statistics', paymentController.getPaymentStatistics);

// Generate payment report
router.get('/report', paymentController.generatePaymentReport);

module.exports = router;
