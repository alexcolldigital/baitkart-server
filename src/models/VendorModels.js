const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const vendorSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: [true, 'Please enter your business name'],
    trim: true,
    maxLength: [100, 'Business name cannot exceed 100 characters']
  },
  ownerName: {
    type: String,
    required: [true, 'Please enter the owner\'s name'],
    maxLength: [50, 'Owner name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please enter your email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Please enter your password'],
    minlength: [6, 'Your password must be at least 6 characters long'],
    select: false
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please enter your phone number'],
    trim: true
  },
  businessAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  businessDescription: {
    type: String,
    trim: true,
    maxLength: [500, 'Business description cannot exceed 500 characters']
  },
  logo: {
    public_id: String,
    url: String
  },
  businessLicense: {
    number: String,
    expiryDate: Date,
    document: {
      public_id: String,
      url: String
    }
  },
  taxIdentificationNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    bankName: String,
    branchCode: String,
    swiftCode: String
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  ratings: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended'],
    default: 'pending'
  },
  commissionRate: {
    type: Number,
    default: 10, // Default commission rate of 10%
    min: 0,
    max: 100
  },
  balance: {
    type: Number,
    default: 0
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  lastLogin: Date,
  stripeAccountId: String
}, {
  timestamps: true
});

// Encrypt password before saving
vendorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare vendor password
vendorSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Return JWT token
vendorSchema.methods.getJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME
  });
};

// Generate password reset token
vendorSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
  return resetToken;
};

// Generate email verification token
vendorSchema.methods.getEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(20).toString('hex');
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
  return verificationToken;
};

// Update vendor rating
vendorSchema.methods.updateRating = function(newRating) {
  this.ratings.count += 1;
  this.ratings.average = ((this.ratings.average * (this.ratings.count - 1)) + newRating) / this.ratings.count;
  return this.save();
};

// Add product to vendor
vendorSchema.methods.addProduct = function(productId) {
  if (!this.products.includes(productId)) {
    this.products.push(productId);
  }
  return this.save();
};

// Remove product from vendor
vendorSchema.methods.removeProduct = function(productId) {
  this.products = this.products.filter(id => id.toString() !== productId.toString());
  return this.save();
};

// Update vendor balance
vendorSchema.methods.updateBalance = function(amount) {
  this.balance += amount;
  return this.save();
};

const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = Vendor;
