const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const vendorMiddleware = require('../middleware/vendorMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/search', productController.searchProducts);
router.get('/:id', productController.getProductById);
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/:id/reviews', productController.getProductReviews);

// Routes that require authentication
router.use(authMiddleware);

// User routes
router.post('/:id/reviews', productController.addProductReview);
router.put('/:id/reviews/:reviewId', productController.updateProductReview);
router.delete('/:id/reviews/:reviewId', productController.deleteProductReview);

// Vendor routes
router.use(vendorMiddleware);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.get('/vendor/products', productController.getVendorProducts);
router.post('/:id/variants', productController.addProductVariant);
router.put('/:id/variants/:variantId', productController.updateProductVariant);
router.delete('/:id/variants/:variantId', productController.deleteProductVariant);

// Admin routes
router.use(adminMiddleware);
router.post('/categories', productController.createCategory);
router.put('/categories/:id', productController.updateCategory);
router.delete('/categories/:id', productController.deleteCategory);
router.get('/admin/all', productController.getAllProductsAdmin);
router.post('/:id/feature', productController.featureProduct);
router.post('/:id/unfeature', productController.unfeatureProduct);
router.put('/:id/status', productController.updateProductStatus);

// Additional routes
router.get('/featured', productController.getFeaturedProducts);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/best-sellers', productController.getBestSellers);
router.get('/deals', productController.getDeals);
router.get('/:id/related', productController.getRelatedProducts);
router.get('/categories', productController.getAllCategories);
router.get('/attributes', productController.getProductAttributes);
router.post('/:id/questions', authMiddleware, productController.askProductQuestion);
router.post('/:id/questions/:questionId/answer', vendorMiddleware, productController.answerProductQuestion);
router.get('/:id/questions', productController.getProductQuestions);
router.post('/:id/report', authMiddleware, productController.reportProduct);
router.get('/vendor/:vendorId', productController.getProductsByVendor);
router.post('/:id/wishlist', authMiddleware, productController.addToWishlist);
router.delete('/:id/wishlist', authMiddleware, productController.removeFromWishlist);
router.get('/wishlist', authMiddleware, productController.getWishlist);
router.post('/:id/compare', productController.addToCompare);
router.get('/compare', productController.getCompareList);
router.post('/:id/notify', authMiddleware, productController.notifyWhenInStock);

module.exports = router;
