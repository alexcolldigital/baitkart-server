const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const authMiddleware = require('../middleware/authMiddleware');
const vendorMiddleware = require('../middleware/vendorMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Apply vendor middleware to all vendor-specific routes
router.use(vendorMiddleware);

// Vendor profile routes
router.get('/profile', vendorController.getProfile);
router.put('/profile', vendorController.updateProfile);
router.put('/change-password', vendorController.changePassword);

// Product management routes
router.get('/products', vendorController.getVendorProducts);
router.post('/products', vendorController.createProduct);
router.get('/products/:id', vendorController.getProductDetails);
router.put('/products/:id', vendorController.updateProduct);
router.delete('/products/:id', vendorController.deleteProduct);
router.post('/products/:id/variants', vendorController.addProductVariant);
router.put('/products/:id/variants/:variantId', vendorController.updateProductVariant);
router.delete('/products/:id/variants/:variantId', vendorController.deleteProductVariant);

// Inventory management routes
router.get('/inventory', vendorController.getInventory);
router.put('/inventory/:productId', vendorController.updateInventory);
router.post('/inventory/bulk-update', vendorController.bulkUpdateInventory);

// Order management routes
router.get('/orders', vendorController.getVendorOrders);
router.get('/orders/:id', vendorController.getOrderDetails);
router.put('/orders/:id/status', vendorController.updateOrderStatus);
router.post('/orders/:id/ship', vendorController.shipOrder);
router.post('/orders/:id/cancel', vendorController.cancelOrder);

// Financial routes
router.get('/earnings', vendorController.getEarnings);
router.get('/payouts', vendorController.getPayouts);
router.post('/payouts/request', vendorController.requestPayout);
router.get('/transactions', vendorController.getTransactions);

// Analytics routes
router.get('/analytics/sales', vendorController.getSalesAnalytics);
router.get('/analytics/products', vendorController.getProductAnalytics);
router.get('/analytics/customers', vendorController.getCustomerAnalytics);

// Review management routes
router.get('/reviews', vendorController.getProductReviews);
router.post('/reviews/:id/respond', vendorController.respondToReview);

// Question & Answer routes
router.get('/questions', vendorController.getProductQuestions);
router.post('/questions/:id/answer', vendorController.answerQuestion);

// Promotion routes
router.get('/promotions', vendorController.getPromotions);
router.post('/promotions', vendorController.createPromotion);
router.put('/promotions/:id', vendorController.updatePromotion);
router.delete('/promotions/:id', vendorController.deletePromotion);

// Coupon routes
router.get('/coupons', vendorController.getCoupons);
router.post('/coupons', vendorController.createCoupon);
router.put('/coupons/:id', vendorController.updateCoupon);
router.delete('/coupons/:id', vendorController.deleteCoupon);

// Notification routes
router.get('/notifications', vendorController.getNotifications);
router.put('/notifications/:id/read', vendorController.markNotificationAsRead);

// Settings routes
router.get('/settings', vendorController.getSettings);
router.put('/settings', vendorController.updateSettings);

// Report generation routes
router.get('/reports/sales', vendorController.generateSalesReport);
router.get('/reports/inventory', vendorController.generateInventoryReport);

// Vendor verification routes
router.post('/verify', vendorController.requestVerification);
router.get('/verification-status', vendorController.getVerificationStatus);

// Vendor support routes
router.post('/support-ticket', vendorController.createSupportTicket);
router.get('/support-tickets', vendorController.getSupportTickets);
router.get('/support-tickets/:id', vendorController.getSupportTicketDetails);
router.post('/support-tickets/:id/reply', vendorController.replySupportTicket);

// Admin routes (protected by admin middleware)
router.use(adminMiddleware);
router.get('/admin/vendors', vendorController.getAllVendors);
router.get('/admin/vendors/:id', vendorController.getVendorDetails);
router.put('/admin/vendors/:id/approve', vendorController.approveVendor);
router.put('/admin/vendors/:id/reject', vendorController.rejectVendor);
router.put('/admin/vendors/:id/suspend', vendorController.suspendVendor);
router.put('/admin/vendors/:id/reinstate', vendorController.reinstateVendor);

module.exports = router;
