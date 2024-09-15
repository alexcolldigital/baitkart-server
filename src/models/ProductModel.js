const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be non-negative'],
    max: [1000000, 'Price cannot exceed 10,000,000']
  },
  discountPercentage: {
    type: Number,
    min: [0, 'Discount percentage must be non-negative'],
    max: [100, 'Discount percentage cannot exceed 100'],
    default: 0
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock must be non-negative'],
    max: [10000, 'Stock cannot exceed 10,000'],
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value for stock'
    }
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    maxlength: [50, 'Brand name cannot exceed 50 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subcategory'
  },
  images: [{
    type: String,
    required: [true, 'At least one product image is required']
  }],
  colors: [{
    type: String,
    trim: true
  }],
  sizes: [{
    type: String,
    trim: true
  }],
  features: [{
    type: String,
    trim: true
  }],
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be at least 0'],
      max: [5, 'Rating cannot exceed 5'],
      set: val => Math.round(val * 10) / 10 // Round to 1 decimal place
    },
    count: {
      type: Number,
      default: 0
    }
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller information is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  weight: {
    value: {
      type: Number,
      min: [0, 'Weight must be non-negative']
    },
    unit: {
      type: String,
      enum: ['g', 'kg', 'oz', 'lb'],
      default: 'g'
    }
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    unit: {
      type: String,
      enum: ['cm', 'in'],
      default: 'cm'
    }
  },
  warranty: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  }
}, {
  timestamps: true
});

// Add text index for search functionality
productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });

// Add pagination plugin
productSchema.plugin(mongoosePaginate);

// Virtual for discounted price
productSchema.virtual('discountedPrice').get(function() {
  return this.price * (1 - this.discountPercentage / 100);
});

// Method to update average rating
productSchema.methods.updateAverageRating = async function(newRating) {
  const oldTotal = this.ratings.average * this.ratings.count;
  this.ratings.count += 1;
  this.ratings.average = (oldTotal + newRating) / this.ratings.count;
  await this.save();
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
