const User = require('../models/user');
const Order = require('../models/order');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

const userController = {
  // Get user profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user profile", error: error.message });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, phone } = req.body;

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.name = name || user.name;
      user.email = email || user.email;
      user.phone = phone || user.phone;

      await user.save();

      res.json({ message: "Profile updated successfully", user });
    } catch (error) {
      res.status(500).json({ message: "Error updating user profile", error: error.message });
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);

      await user.save();

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error changing password", error: error.message });
    }
  },

  // Add address
  addAddress: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { street, city, state, country, zipCode, isDefault } = req.body;

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const newAddress = {
        street,
        city,
        state,
        country,
        zipCode,
        isDefault
      };

      if (isDefault) {
        user.addresses.forEach(address => address.isDefault = false);
      }

      user.addresses.push(newAddress);
      await user.save();

      res.json({ message: "Address added successfully", addresses: user.addresses });
    } catch (error) {
      res.status(500).json({ message: "Error adding address", error: error.message });
    }
  },

  // Update address
  updateAddress: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { addressId } = req.params;
      const { street, city, state, country, zipCode, isDefault } = req.body;

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const address = user.addresses.id(addressId);
      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }

      address.street = street || address.street;
      address.city = city || address.city;
      address.state = state || address.state;
      address.country = country || address.country;
      address.zipCode = zipCode || address.zipCode;

      if (isDefault) {
        user.addresses.forEach(addr => addr.isDefault = false);
        address.isDefault = true;
      }

      await user.save();

      res.json({ message: "Address updated successfully", addresses: user.addresses });
    } catch (error) {
      res.status(500).json({ message: "Error updating address", error: error.message });
    }
  },

  // Delete address
  deleteAddress: async (req, res) => {
    try {
      const { addressId } = req.params;

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.addresses.pull(addressId);
      await user.save();

      res.json({ message: "Address deleted successfully", addresses: user.addresses });
    } catch (error) {
      res.status(500).json({ message: "Error deleting address", error: error.message });
    }
  },

  // Get user orders
  getUserOrders: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 },
        populate: 'items.product'
      };

      const orders = await Order.paginate({ user: req.user.id }, options);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user orders", error: error.message });
    }
  },

  // Update user preferences
  updatePreferences: async (req, res) => {
    try {
      const { preferences } = req.body;

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.preferences = { ...user.preferences, ...preferences };
      await user.save();

      res.json({ message: "Preferences updated successfully", preferences: user.preferences });
    } catch (error) {
      res.status(500).json({ message: "Error updating preferences", error: error.message });
    }
  },

  // Deactivate account
  deactivateAccount: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.isActive = false;
      await user.save();

      res.json({ message: "Account deactivated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deactivating account", error: error.message });
    }
  }
};

module.exports = userController;
