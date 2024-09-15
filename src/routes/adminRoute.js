const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Middleware to ensure the user is authenticated and an admin
const ensureAdmin = [authMiddleware, adminMiddleware];

// Dashboard
router.get('/dashboard', ensureAdmin, adminController.getDashboard);

// User Management
router.get('/users', ensureAdmin, adminController.getAllUsers);
router.get('/users/:id', ensureAdmin, adminController.getUserDetails);
router.put('/users/:id', ensureAdmin, adminController.updateUser);
router.delete('/users/:id', ensureAdmin, adminController.deleteUser);
router.post('/users/:id/ban', ensureAdmin, adminController.banUser);
router.post('/users/:id/unban', ensureAdmin, adminController.unbanUser);

// Vendor Management
router.get('/vendors', ensureAdmin, adminController.getAllVendors);
router.get('/vendors/:id', ensureAdmin, adminController.getVendorDetails);
router.put('/vendors/:id', ensureAdmin, adminController.updateVendor);
router.post('/vendors/:id/approve', ensureAdmin, adminController.approveVendor);
router.post('/vendors/:id/reject', ensureAdmin, adminController.rejectVendor);
router.post('/vendors/:id/suspend', ensureAdmin, adminController.suspendVendor);

// Product Management
router.get('/products', ensureAdmin, adminController.getAllProducts);
router.get('/products/:id', ensureAdmin, adminController.getProductDetails);
router.put('/products/:id', ensureAdmin, adminController.updateProduct);
router.delete('/products/:id', ensureAdmin, adminController.deleteProduct);
router.post('/products/:id/approve', ensureAdmin, adminController.approveProduct);
router.post('/products/:id/reject', ensureAdmin, adminController.rejectProduct);

// Order Management
router.get('/orders', ensureAdmin, adminController.getAllOrders);
router.get('/orders/:id', ensureAdmin, adminController.getOrderDetails);
router.put('/orders/:id', ensureAdmin, adminController.updateOrderStatus);
router.post('/orders/:id/refund', ensureAdmin, adminController.refundOrder);

// Category Management
router.get('/categories', ensureAdmin, adminController.getAllCategories);
router.post('/categories', ensureAdmin, adminController.createCategory);
router.put('/categories/:id', ensureAdmin, adminController.updateCategory);
router.delete('/categories/:id', ensureAdmin, adminController.deleteCategory);

// Review Management
router.get('/reviews', ensureAdmin, adminController.getAllReviews);
router.delete('/reviews/:id', ensureAdmin, adminController.deleteReview);

// Transaction Management
router.get('/transactions', ensureAdmin, adminController.getAllTransactions);
router.get('/transactions/:id', ensureAdmin, adminController.getTransactionDetails);

// Reports
router.get('/reports/sales', ensureAdmin, adminController.getSalesReport);
router.get('/reports/revenue', ensureAdmin, adminController.getRevenueReport);
router.get('/reports/user-growth', ensureAdmin, adminController.getUserGrowthReport);

// Settings
router.get('/settings', ensureAdmin, adminController.getSettings);
router.put('/settings', ensureAdmin, adminController.updateSettings);

// Logs
router.get('/logs', ensureAdmin, adminController.getLogs);

// Backup
router.post('/backup', ensureAdmin, adminController.createBackup);
router.get('/backups', ensureAdmin, adminController.getBackups);
router.post('/backups/:id/restore', ensureAdmin, adminController.restoreBackup);

module.exports = router;
