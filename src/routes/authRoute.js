const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// User Registration
router.post('/register', authController.register);

// User Login
router.post('/login', authController.login);

// User Logout
router.post('/logout', authMiddleware, authController.logout);

// Refresh Token
router.post('/refresh-token', authController.refreshToken);

// Forgot Password
router.post('/forgot-password', authController.forgotPassword);

// Reset Password
router.post('/reset-password/:token', authController.resetPassword);

// Get Current User
router.get('/me', authMiddleware, authController.getCurrentUser);

// Update User Profile
router.put('/update-profile', authMiddleware, authController.updateProfile);

// Change Password
router.put('/change-password', authMiddleware, authController.changePassword);

// Email Verification
router.post('/send-verification-email', authMiddleware, authController.sendVerificationEmail);
router.get('/verify-email/:token', authController.verifyEmail);

// Social Authentication
router.post('/google', authController.googleAuth);
router.post('/facebook', authController.facebookAuth);

// Two-Factor Authentication
router.post('/enable-2fa', authMiddleware, authController.enable2FA);
router.post('/disable-2fa', authMiddleware, authController.disable2FA);
router.post('/verify-2fa', authMiddleware, authController.verify2FA);

// Delete Account
router.delete('/delete-account', authMiddleware, authController.deleteAccount);

// Check Username Availability
router.get('/check-username/:username', authController.checkUsernameAvailability);

// Check Email Availability
router.get('/check-email/:email', authController.checkEmailAvailability);

// Get Login History
router.get('/login-history', authMiddleware, authController.getLoginHistory);

// Get Active Sessions
router.get('/active-sessions', authMiddleware, authController.getActiveSessions);
router.post('/revoke-session/:sessionId', authMiddleware, authController.revokeSession);

module.exports = router;
