const Wallet = require('../models/wallet');
const Transaction = require('../models/transaction');
const User = require('../models/user');
const { validationResult } = require('express-validator');

const walletController = {
  // Get wallet balance
  getBalance: async (req, res) => {
    try {
      const wallet = await Wallet.findOne({ user: req.user.id });
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      res.json({ balance: wallet.balance });
    } catch (error) {
      res.status(500).json({ message: "Error fetching wallet balance", error: error.message });
    }
  },

  // Add funds to wallet
  addFunds: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { amount } = req.body;

      let wallet = await Wallet.findOne({ user: req.user.id });
      if (!wallet) {
        wallet = new Wallet({ user: req.user.id, balance: 0 });
      }

      wallet.balance += amount;
      await wallet.save();

      const transaction = new Transaction({
        user: req.user.id,
        type: 'credit',
        amount,
        description: 'Add funds to wallet',
        balance: wallet.balance
      });
      await transaction.save();

      res.json({ message: "Funds added successfully", balance: wallet.balance });
    } catch (error) {
      res.status(500).json({ message: "Error adding funds to wallet", error: error.message });
    }
  },

  // Withdraw funds from wallet
  withdrawFunds: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { amount } = req.body;

      const wallet = await Wallet.findOne({ user: req.user.id });
      if (!wallet || wallet.balance < amount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }

      wallet.balance -= amount;
      await wallet.save();

      const transaction = new Transaction({
        user: req.user.id,
        type: 'debit',
        amount,
        description: 'Withdraw funds from wallet',
        balance: wallet.balance
      });
      await transaction.save();

      res.json({ message: "Funds withdrawn successfully", balance: wallet.balance });
    } catch (error) {
      res.status(500).json({ message: "Error withdrawing funds from wallet", error: error.message });
    }
  },

  // Get transaction history
  getTransactionHistory: async (req, res) => {
    try {
      const { page = 1, limit = 10, type } = req.query;
      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 }
      };

      let query = { user: req.user.id };
      if (type) {
        query.type = type;
      }

      const transactions = await Transaction.paginate(query, options);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transaction history", error: error.message });
    }
  },

  // Transfer funds to another user
  transferFunds: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { recipientId, amount } = req.body;

      const senderWallet = await Wallet.findOne({ user: req.user.id });
      if (!senderWallet || senderWallet.balance < amount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }

      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" });
      }

      let recipientWallet = await Wallet.findOne({ user: recipientId });
      if (!recipientWallet) {
        recipientWallet = new Wallet({ user: recipientId, balance: 0 });
      }

      // Perform the transfer
      senderWallet.balance -= amount;
      recipientWallet.balance += amount;

      await senderWallet.save();
      await recipientWallet.save();

      // Record transactions
      const senderTransaction = new Transaction({
        user: req.user.id,
        type: 'debit',
        amount,
        description: `Transfer to ${recipient.name}`,
        balance: senderWallet.balance
      });
      await senderTransaction.save();

      const recipientTransaction = new Transaction({
        user: recipientId,
        type: 'credit',
        amount,
        description: `Transfer from ${req.user.name}`,
        balance: recipientWallet.balance
      });
      await recipientTransaction.save();

      res.json({ message: "Funds transferred successfully", balance: senderWallet.balance });
    } catch (error) {
      res.status(500).json({ message: "Error transferring funds", error: error.message });
    }
  },

  // Get wallet statistics
  getWalletStats: async (req, res) => {
    try {
      const wallet = await Wallet.findOne({ user: req.user.id });
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      const totalCredits = await Transaction.aggregate([
        { $match: { user: req.user.id, type: 'credit' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const totalDebits = await Transaction.aggregate([
        { $match: { user: req.user.id, type: 'debit' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const lastTransaction = await Transaction.findOne({ user: req.user.id }).sort({ createdAt: -1 });

      res.json({
        currentBalance: wallet.balance,
        totalCredits: totalCredits[0]?.total || 0,
        totalDebits: totalDebits[0]?.total || 0,
        lastTransaction: lastTransaction || null
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching wallet statistics", error: error.message });
    }
  }
};

module.exports = walletController;
