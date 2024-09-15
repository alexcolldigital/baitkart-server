const Vendor = require('../models/vendor');
const Product = require('../models/product');
const Order = require('../models/order');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const vendorController = {
  // Register a new vendor
  register: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, businessName, businessAddress, phoneNumber } = req.body;

      let vendor = await Vendor.findOne({ email });
      if (vendor) {
        return res.status(400).json({ message: "Vendor already exists" });
      }

      vendor = new Vendor({
        name,
        email,
        password,
        businessName,
        businessAddress,
        phoneNumber
      });

      const salt = await bcrypt.genSalt(10);
      vendor.password = await bcrypt.hash(password, salt);

      await vendor.save();

      const payload = {
        vendor: {
          id: vendor.id
        }
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (error) {
      res.status(500).json({ message: "Error in vendor registration", error: error.message });
    }
  },

  // Vendor login
  login: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      let vendor = await Vendor.findOne({ email });
      if (!vendor) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, vendor.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const payload = {
        vendor: {
          id: vendor.id
        }
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (error) {
      res.status(500).json({ message: "Error in vendor login", error: error.message });
    }
  },

  // Get vendor profile
  getProfile: async (req, res) => {
    try {
      const vendor = await Vendor.findById(req.vendor.id).select('-password');
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      res.status(500).json({ message: "Error fetching vendor profile", error: error.message });
    }
  },

  // Update vendor profile
  updateProfile: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, businessName, businessAddress, phoneNumber } = req.body;

      const vendor = await Vendor.findById(req.vendor.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      vendor.name = name || vendor.name;
      vendor.businessName = businessName || vendor.businessName;
      vendor.businessAddress = businessAddress || vendor.businessAddress;
      vendor.phoneNumber = phoneNumber || vendor.phoneNumber;

      await vendor.save();

      res.json({ message: "Profile updated successfully", vendor });
    } catch (error) {
      res.status(500).json({ message: "Error updating vendor profile", error: error.message });
    }
  },

  // Get vendor products
  getProducts: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 }
      };

      const products = await Product.paginate({ vendor: req.vendor.id }, options);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching vendor products", error: error.message });
    }
  },

  // Add a new product
  addProduct: async (req, res) => {
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
        vendor: req.vendor.id
      });

      await product.save();

      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ message: "Error adding product", error: error.message });
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

      const product = await Product.findOne({ _id: req.params.id, vendor: req.vendor.id });
      if (!product) {
        return res.status(404).json({ message: "Product not found or not authorized" });
      }

      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price || product.price;
      product.category = category || product.category;
      product.stock = stock || product.stock;
      product.images = images || product.images;

      await product.save();

      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Error updating product", error: error.message });
    }
  },

  // Delete a product
  deleteProduct: async (req, res) => {
    try {
      const product = await Product.findOneAndDelete({ _id: req.params.id, vendor: req.vendor.id });
      if (!product) {
        return res.status(404).json({ message: "Product not found or not authorized" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting product", error: error.message });
    }
  },

  // Get vendor orders
  getOrders: async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 },
        populate: 'user'
      };

      let query = { 'items.vendor': req.vendor.id };
      if (status) {
        query.status = status;
      }

      const orders = await Order.paginate(query, options);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Error fetching vendor orders", error: error.message });
    }
  },

  // Update order status
  updateOrderStatus: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      const order = await Order.findOne({ _id: orderId, 'items.vendor': req.vendor.id });
      if (!order) {
        return res.status(404).json({ message: "Order not found or not authorized" });
      }

      // Update status only for items belonging to this vendor
      order.items.forEach(item => {
        if (item.vendor.toString() === req.vendor.id) {
          item.status = status;
        }
      });

      await order.save();

      res.json({ message: "Order status updated successfully", order });
    } catch (error) {
      res.status(500).json({ message: "Error updating order status", error: error.message });
    }
  },

  // Get vendor analytics
  getAnalytics: async (req, res) => {
    try {
      const totalProducts = await Product.countDocuments({ vendor: req.vendor.id });
      const totalOrders = await Order.countDocuments({ 'items.vendor': req.vendor.id });
      const totalRevenue = await Order.aggregate([
        { $unwind: '$items' },
        { $match: { 'items.vendor': req.vendor.id } },
        { $group: { _id: null, total: { $sum: '$items.price' } } }
      ]);

      res.json({
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching vendor analytics", error: error.message });
    }
  }
};

module.exports = vendorController;
