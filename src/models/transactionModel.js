const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required for a transaction']
  },
  type: {
    type: String,
    enum: ['purchase', 'refund', 'withdrawal', 'deposit', 'transfer'],
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Transaction amount is required'],
    min: [0.01, 'Amount must be at least 0.01']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 3
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'bank_transfer', 'paypal', 'wallet'],
    required: [true, 'Payment method is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  reference: {
    type: String,
    unique: true,
    required: [true, 'Transaction reference is required']
  },
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  relatedProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  metadata: {
    type: Map,
    of: String
  },
  fees: {
    type: Number,
    default: 0,
    min: [0, 'Fees cannot be negative']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  exchangeRate: {
    type: Number,
    min: [0, 'Exchange rate must be positive']
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  isRefunded: {
    type: Boolean,
    default: false
  },
  refundReason: {
    type: String,
    trim: true
  },
  refundedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Add index for faster queries
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ reference: 1 }, { unique: true });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });

// Add text index for search functionality
transactionSchema.index({ description: 'text', reference: 'text' });

// Add pagination plugin
transactionSchema.plugin(mongoosePaginate);

// Virtual for total amount including fees and tax
transactionSchema.virtual('totalAmount').get(function() {
  return this.amount + this.fees + this.tax;
});

// Method to update transaction status
transactionSchema.methods.updateStatus = async function(newStatus) {
  this.status = newStatus;
  if (newStatus === 'completed') {
    this.completedAt = new Date();
  }
  await this.save();
};

// Method to process refund
transactionSchema.methods.processRefund = async function(reason) {
  if (this.isRefunded) {
    throw new Error('Transaction has already been refunded');
  }
  this.isRefunded = true;
  this.refundReason = reason;
  this.refundedAt = new Date();
  await this.save();
};

// Static method to get total transactions amount for a user
transactionSchema.statics.getTotalAmountForUser = async function(userId) {
  const result = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId), status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  return result.length > 0 ? result[0].total : 0;
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
