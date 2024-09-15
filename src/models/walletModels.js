const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: [0, 'Wallet balance cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  transactions: [{
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    reference: {
      type: String,
      unique: true,
      required: true
    },
    metadata: {
      type: Map,
      of: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add pagination plugin
walletSchema.plugin(mongoosePaginate);

// Index for faster queries
walletSchema.index({ user: 1 });
walletSchema.index({ 'transactions.createdAt': -1 });
walletSchema.index({ 'transactions.reference': 1 }, { unique: true });

// Virtual for total credits
walletSchema.virtual('totalCredits').get(function() {
  return this.transactions
    .filter(t => t.type === 'credit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
});

// Virtual for total debits
walletSchema.virtual('totalDebits').get(function() {
  return this.transactions
    .filter(t => t.type === 'debit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
});

// Method to add a transaction
walletSchema.methods.addTransaction = async function(transactionData) {
  this.transactions.push(transactionData);
  
  if (transactionData.status === 'completed') {
    if (transactionData.type === 'credit') {
      this.balance += transactionData.amount;
    } else if (transactionData.type === 'debit') {
      if (this.balance < transactionData.amount) {
        throw new Error('Insufficient funds');
      }
      this.balance -= transactionData.amount;
    }
  }

  this.lastUpdated = Date.now();
  return this.save();
};

// Method to update transaction status
walletSchema.methods.updateTransactionStatus = async function(reference, newStatus) {
  const transaction = this.transactions.find(t => t.reference === reference);
  if (!transaction) {
    throw new Error('Transaction not found');
  }

  const oldStatus = transaction.status;
  transaction.status = newStatus;

  if (oldStatus !== 'completed' && newStatus === 'completed') {
    if (transaction.type === 'credit') {
      this.balance += transaction.amount;
    } else if (transaction.type === 'debit') {
      if (this.balance < transaction.amount) {
        throw new Error('Insufficient funds');
      }
      this.balance -= transaction.amount;
    }
  } else if (oldStatus === 'completed' && newStatus !== 'completed') {
    if (transaction.type === 'credit') {
      this.balance -= transaction.amount;
    } else if (transaction.type === 'debit') {
      this.balance += transaction.amount;
    }
  }

  this.lastUpdated = Date.now();
  return this.save();
};

// Static method to get wallet by user ID
walletSchema.statics.getByUserId = function(userId) {
  return this.findOne({ user: userId });
};

// Static method to get transactions within a date range
walletSchema.statics.getTransactionsByDateRange = function(userId, startDate, endDate) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    { $unwind: '$transactions' },
    { $match: { 
      'transactions.createdAt': { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      } 
    } },
    { $sort: { 'transactions.createdAt': -1 } }
  ]);
};

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
