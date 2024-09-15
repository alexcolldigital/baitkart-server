const Product = require('../models/product');
const Category = require('../models/category');
const { validationResult } = require('express-validator');

const productController = {
  // Create a new product
  createProduct: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, price, category, stock, images } = req.body;

      const product = new Product({
        name,
        description,
        price,
        category,
        stock,
        images,
        seller: req.user.id // Assuming you have authentication middleware
      });

      await product.save();

      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ message: "Error creating product", error: error.message });
    }
  },

  // Get all products
  getAllProducts: async (req, res) => {
    try {
      const { page = 1, limit = 10, sort, category } = req.query;
      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: sort ? { [sort]: 1 } : { createdAt: -1 },
        populate: 'category seller'
      };

      let query = {};
      if (category) {
        query.category = category;
      }

      const products = await Product.paginate(query, options);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching products", error: error.message });
    }
  },

  // Get a single product by ID
  getProductById: async (req, res) => {
    try {
      const product = await Product.findById(req.params.id)
        .populate('category')
        .populate('seller', 'name email');

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Error fetching product", error: error.message });
    }
  },

  // Update a product
  updateProduct: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, price, category, stock, images } = req.body;

      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check if the user is the seller of the product
      if (product.seller.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this product" });
      }

      product.name = name;
      product.description = description;
      product.price = price;
      product.category = category;
      product.stock = stock;
      product.images = images;

      await product.save();

      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Error updating product", error: error.message });
    }
  },

  // Delete a product
  deleteProduct: async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check if the user is the seller of the product
      if (product.seller.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this product" });
      }

      await product.remove();

      res.json({ message: "Product removed" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting product", error: error.message });
    }
  },

  // Search products
  searchProducts: async (req, res) => {
    try {
      const { q, page = 1, limit = 10 } = req.query;
      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        populate: 'category seller'
      };

      const query = { $text: { $search: q } };

      const products = await Product.paginate(query, options);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error searching products", error: error.message });
    }
  },

  // Get product categories
  getCategories: async (req, res) => {
    try {
      const categories = await Category.find();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories", error: error.message });
    }
  },

  // Add a new category
  addCategory: async (req, res) => {
    try {
      const { name } = req.body;

      const category = new Category({ name });
      await category.save();

      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: "Error adding category", error: error.message });
    }
  },

  // Get products by seller
  getProductsBySeller: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        populate: 'category'
      };

      const query = { seller: req.params.sellerId };

      const products = await Product.paginate(query, options);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching seller's products", error: error.message });
    }
  }
};

module.exports = productController;
