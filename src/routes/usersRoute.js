const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password/:token', userController.resetPassword);

// Routes that require authentication
router.use(authMiddleware);

// User profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);
router.delete('/delete-account', userController.deleteAccount);

// Address routes
router.get('/addresses', userController.getAddresses);
router.post('/addresses', userController.addAddress);
router.put('/addresses/:id', userController.updateAddress);
router.delete('/addresses/:id', userController.deleteAddress);
router.post('/addresses/:id/set-default', userController.setDefaultAddress);

// Order routes
router.get('/orders', userController.getOrders);
router.get('/orders/:id', userController.getOrderDetails);

// Wishlist routes
router.get('/wishlist', userController.getWishlist);
router.post('/wishlist/:productId', userController.addToWishlist);
router.delete('/wishlist/:productId', userController.removeFromWishlist);

// Review routes
router.get('/reviews', userController.getUserReviews);
router.delete('/reviews/:id', userController.deleteReview);

// Notification routes
router.get('/notifications', userController.getNotifications);
router.put('/notifications/:id/read', userController.markNotificationAsRead);
router.delete('/notifications/:id', userController.deleteNotification);

// Payment method routes
router.get('/payment-methods', userController.getPaymentMethods);
router.post('/payment-methods', userController.addPaymentMethod);
router.delete('/payment-methods/:id', userController.removePaymentMethod);
router.put('/payment-methods/:id/set-default', userController.setDefaultPaymentMethod);

// Wallet routes
router.get('/wallet', userController.getWalletBalance);
router.post('/wallet/topup', userController.topUpWallet);
router.get('/wallet/transactions', userController.getWalletTransactions);

// Referral routes
router.get('/referrals', userController.getReferrals);
router.post('/referrals/invite', userController.inviteFriend);

// User settings routes
router.get('/settings', userController.getUserSettings);
router.put('/settings', userController.updateUserSettings);

// Email verification
router.post('/send-verification-email', userController.sendVerificationEmail);
router.get('/verify-email/:token', userController.verifyEmail);

// Two-factor authentication
router.post('/enable-2fa', userController.enable2FA);
router.post('/disable-2fa', userController.disable2FA);
router.post('/verify-2fa', userController.verify2FA);

// Social media connection
router.post('/connect/:provider', userController.connectSocialMedia);
router.delete('/disconnect/:provider', userController.disconnectSocialMedia);

// Activity log
router.get('/activity-log', userController.getActivityLog);

// Seller application
router.post('/apply-seller', userController.applyAsSeller);
router.get('/seller-application-status', userController.getSellerApplicationStatus);

// Admin routes (protected by admin middleware)
router.use(adminMiddleware);
router.get('/admin/users', userController.getAllUsers);
router.get('/admin/users/:id', userController.getUserDetails);
router.put('/admin/users/:id', userController.updateUser);
router.delete('/admin/users/:id', userController.deleteUser);
router.post('/admin/users/:id/ban', userController.banUser);
router.post('/admin/users/:id/unban', userController.unbanUser);

module.exports = router;
