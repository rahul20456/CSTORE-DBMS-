const Mongoose = require('mongoose');
const { Schema } = Mongoose;

const SellerSchema = new Schema({
  name: {
    type: String,
    trim: true,
    index: true,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  brand: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  business: {
    // Business description
    type: String,
    trim: true,
    required: true,
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Mongoose.model('Seller', SellerSchema);
