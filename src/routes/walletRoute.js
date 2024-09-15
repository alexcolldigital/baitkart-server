const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// User wallet routes
router.get('/balance', walletController.getWalletBalance);
router.get('/transactions', walletController.getTransactions);
router.post('/add-funds', walletController.addFunds);
router.post('/withdraw', walletController.withdrawFunds);
router.post('/transfer', walletController.transferFunds);
router.get('/statement', walletController.getWalletStatement);

// Payment routes
router.post('/pay', walletController.makePayment);
router.post('/request-payment', walletController.requestPayment);
router.post('/accept-payment-request', walletController.acceptPaymentRequest);
router.post('/reject-payment-request', walletController.rejectPaymentRequest);

// Refund routes
router.post('/refund', walletController.initiateRefund);
router.get('/refunds', walletController.getRefunds);

// Wallet settings
router.get('/settings', walletController.getWalletSettings);
router.put('/settings', walletController.updateWalletSettings);

// Auto-reload settings
router.post('/auto-reload', walletController.setAutoReload);
router.delete('/auto-reload', walletController.removeAutoReload);

// Wallet limits
router.get('/limits', walletController.getWalletLimits);

// Currency conversion
router.get('/convert', walletController.convertCurrency);

// Wallet status
router.get('/status', walletController.getWalletStatus);
router.post('/activate', walletController.activateWallet);
router.post('/deactivate', walletController.deactivateWallet);

// Linked payment methods
router.get('/payment-methods', walletController.getLinkedPaymentMethods);
router.post('/payment-methods', walletController.addPaymentMethod);
router.delete('/payment-methods/:id', walletController.removePaymentMethod);

// Transaction details
router.get('/transactions/:id', walletController.getTransactionDetails);

// Recurring payments
router.post('/recurring-payment', walletController.setupRecurringPayment);
router.get('/recurring-payments', walletController.getRecurringPayments);
router.delete('/recurring-payments/:id', walletController.cancelRecurringPayment);

// Wallet to bank transfer
router.post('/bank-transfer', walletController.transferToBank);

// Promotional offers
router.get('/offers', walletController.getWalletOffers);
router.post('/redeem-offer', walletController.redeemOffer);

// Wallet analytics
router.get('/analytics', walletController.getWalletAnalytics);

// Admin routes (protected by admin middleware)
router.use(adminMiddleware);
router.get('/admin/wallets', walletController.getAllWallets);
router.get('/admin/wallets/:id', walletController.getWalletDetails);
router.put('/admin/wallets/:id/adjust-balance', walletController.adjustWalletBalance);
router.post('/admin/wallets/:id/freeze', walletController.freezeWallet);
router.post('/admin/wallets/:id/unfreeze', walletController.unfreezeWallet);
router.get('/admin/transactions', walletController.getAllTransactions);
router.post('/admin/reverse-transaction', walletController.reverseTransaction);

module.exports = router;
