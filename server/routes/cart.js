const express = require('express');
const router = express.Router();

const Cart = require('../models/cart');
const Product = require('../models/product');
const auth = require('../middleware/auth');

// Calculate Tax on items
const calTax = (items) => {
  const products = items.map((item) => {
    item.priceBeforeTax = item.price;

    item.netPrice = parseFloat(
      Number((item.priceBeforeTax * item.quota).toFixed(2))
    );

    item.netTax = parseFloat(
      Number((item.priceBeforeTax * (0.02 / 100) * 100 * item.quota).toFixed(2))
    );
    item.priceAfterTax = parseFloat(
      Number((item.netPrice + item.netTax).toFixed(2))
    );

    return item;
  });

  return products;
};

router.post('/add', auth, async (req, res) => {
  try {
    const user = req.user._id;
    const products = calTax(req.body.products);

    const cart = new Cart({
      user,
      products,
    });

    const cDoc = await cart.save();

    decreaseQuantity(products);

    res.status(200).json({
      success: true,
      cartId: cDoc.id,
    });
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

router.delete('/delete/:cartId', auth, async (req, res) => {
  try {
    await Cart.deleteOne({ _id: req.params.cartId });

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

router.post('/add/:cartId', auth, async (req, res) => {
  try {
    const product = req.body.product;
    const query = { _id: req.params.cartId };

    await Cart.updateOne(query, { $push: { products: product } }).exec();

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

router.delete('/delete/:cartId/:productId', auth, async (req, res) => {
  try {
    const product = { product: req.params.productId };
    const query = { _id: req.params.cartId };

    await Cart.updateOne(query, { $pull: { products: product } }).exec();

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

const decreaseQuantity = (products) => {
  let bulkOptions = products.map((item) => {
    return {
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quota: -item.quota } },
      },
    };
  });

  Product.bulkWrite(bulkOptions);
};

module.exports = router;
