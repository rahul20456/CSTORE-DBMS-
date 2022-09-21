const Mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
const { Schema } = Mongoose;

const options = {
  separator: '-',
  lang: 'en',
  truncate: 120,
};

Mongoose.plugin(slug, options);

const ProductSchema = new Schema({
  name: {
    type: String,
    trim: true,
    unique: true,
    index: true,
    required: true,
  },
  slug: {
    type: String,
    slug: 'name',
    unique: true,
    index: true,
  },
  image: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    trim: true,
    required: true,
  },
  quota: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  brand: {
    type: Schema.Types.ObjectId,
    ref: 'Brand',
    default: null,
  },
});

module.exports = Mongoose.model('Product', ProductSchema);
