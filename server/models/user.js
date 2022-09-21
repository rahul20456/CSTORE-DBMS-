const Mongoose = require('mongoose');

const { Schema } = Mongoose;

const UserSchema = new Schema({
  email: {
    type: String,
    index: true,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
  },
  name: {
    type: String,
    required: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
  },
  seller: {
    type: Schema.Types.ObjectId,
    ref: 'Seller',
    default: null,
  },
  role: {
    type: String,
    default: 'MEMBER',
    enum: ['MEMBER', 'ADMIN', 'SELLER'],
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Mongoose.model('User', UserSchema);
