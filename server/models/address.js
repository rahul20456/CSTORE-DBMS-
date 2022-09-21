const Mongoose = require('mongoose');
const { Schema } = Mongoose;

const AddressSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  address: {
    type: String,
    index: true,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
});

module.exports = Mongoose.model('Address', AddressSchema);
