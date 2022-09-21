const Mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
const { Schema } = Mongoose;

Mongoose.plugin(slug, {
  separator: '-',
  lang: 'en',
  truncate: 80,
});

const BrandSchema = new Schema({
  name: {
    type: String,
    trim: true,
    index: true,
    required: true,
  },
  slug: {
    type: String,
    slug: 'name',
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  seller: {
    type: Schema.Types.ObjectId,
    ref: 'Seller',
    default: null,
  },
});

module.exports = Mongoose.model('Brand', BrandSchema);
