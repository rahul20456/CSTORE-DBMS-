const Mongoose = require('mongoose');
const { Schema } = Mongoose;

const CartItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
  },
  quota: Number,
  priceBeforeTax: {
    type: Number,
    default: 0,
  },
  netPrice: {
    type: Number,
    default: 0,
  },
  priceAfterTax: {
    type: Number,
    default: 0,
  },
  netTax: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    default: 'Not processed',
    enum: ['Not processed', 'Processing', 'Delivered', 'Cancelled'],
  },
});

module.exports = Mongoose.model('CartItem', CartItemSchema);

const CartSchema = new Schema({
  products: [CartItemSchema],
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Mongoose.model('Cart', CartSchema);
