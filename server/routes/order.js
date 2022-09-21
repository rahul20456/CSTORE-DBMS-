const express = require('express');
const router = express.Router();
const Mongoose = require('mongoose');

const Order = require('../models/order');
const Cart = require('../models/cart');
const Product = require('../models/product');
const auth = require('../middleware/auth');
const role = require('../middleware/findRole');

// Calculate Tax
const calTax = (order) => {
  const taxRate = 0.02;

  order.netTax = 0;
  if (order.products && order.products.length > 0) {
    order.products.map((item) => {
      const price = item.priceBeforeTax || item.product.price;
      const quota = item.quota;
      item.netPrice = price * quota;
      item.priceBeforeTax = price;

      if (item.status !== 'Cancelled') {
        if (item.priceAfterTax === 0) {
          const taxAmount = price * (taxRate / 100) * 100;
          item.netTax = parseFloat(Number((taxAmount * quota).toFixed(2)));

          order.netTax += item.netTax;
        } else {
          order.netTax += item.netTax;
        }
      }

      item.priceAfterTax = parseFloat(
        Number((item.netPrice + item.netTax).toFixed(2))
      );
    });
  }

  order.totalWithTax = order.total + order.netTax;
  order.total = parseFloat(Number(order.total.toFixed(2)));
  order.netTax = parseFloat(Number(order.netTax && order.netTax.toFixed(2)));
  order.totalWithTax = parseFloat(Number(order.totalWithTax.toFixed(2)));
  return order;
};

router.post('/add', auth, async (req, res) => {
  try {
    const cart = req.body.cartId;
    const total = req.body.total;
    const user = req.user._id;

    const order = new Order({
      cart,
      user,
      total,
    });

    const oDoc = await order.save();

    await Cart.findById(oDoc.cart._id).populate({
      path: 'products.product',
      populate: {
        path: 'brand',
      },
    });

    res.status(200).json({
      success: true,
      message: `Order placed!`,
      order: { _id: oDoc._id },
    });
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

router.get('/search', auth, async (req, res) => {
  try {
    const { search } = req.query;

    if (!Mongoose.Types.ObjectId.isValid(search)) {
      return res.status(200).json({
        orders: [],
      });
    }

    let osDoc = null;
    const isAdmin = req.user.role === role.ROLES.Admin;

    if (isAdmin) {
      osDoc = await Order.find({
        _id: Mongoose.Types.ObjectId(search),
      }).populate({
        path: 'cart',
        populate: {
          path: 'products.product',
          populate: {
            path: 'brand',
          },
        },
      });
    } else {
      const user = req.user._id;
      osDoc = await Order.find({
        _id: Mongoose.Types.ObjectId(search),
        user,
      }).populate({
        path: 'cart',
        populate: {
          path: 'products.product',
          populate: {
            path: 'brand',
          },
        },
      });
    }

    osDoc = osDoc.filter((order) => order.cart);

    if (osDoc.length > 0) {
      const newOrders = osDoc.map((o) => {
        return {
          _id: o._id,
          total: parseFloat(Number(o.total.toFixed(2))),
          created: o.created,
          products: o.cart?.products,
        };
      });

      let orders = newOrders.map((o) => calTax(o));
      orders.sort((a, b) => b.created - a.created);
      res.status(200).json({
        orders,
      });
    } else {
      res.status(200).json({
        orders: [],
      });
    }
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const user = req.user._id;

    let osDoc = await Order.find({ user }).populate({
      path: 'cart',
      populate: {
        path: 'products.product',
        populate: {
          path: 'brand',
        },
      },
    });

    osDoc = osDoc.filter((order) => order.cart);

    if (osDoc.length > 0) {
      const newOrders = osDoc.map((o) => {
        return {
          _id: o._id,
          total: parseFloat(Number(o.total.toFixed(2))),
          created: o.created,
          products: o.cart?.products,
        };
      });

      let orders = newOrders.map((o) => calTax(o));
      orders.sort((a, b) => b.created - a.created);
      res.status(200).json({
        orders,
      });
    } else {
      res.status(200).json({
        orders: [],
      });
    }
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

router.get('/:orderId', auth, async (req, res) => {
  try {
    const orderId = req.params.orderId;

    let oDoc = null;

    if (req.user.role === role.ROLES.Admin) {
      oDoc = await Order.findOne({ _id: orderId }).populate({
        path: 'cart',
        populate: {
          path: 'products.product',
          populate: {
            path: 'brand',
          },
        },
      });
    } else {
      const user = req.user._id;
      oDoc = await Order.findOne({ _id: orderId, user }).populate({
        path: 'cart',
        populate: {
          path: 'products.product',
          populate: {
            path: 'brand',
          },
        },
      });
    }

    if (!oDoc || !oDoc.cart) {
      return res.status(404).json({
        message: `Cannot find order with the id: ${orderId}.`,
      });
    }

    let order = {
      _id: oDoc._id,
      total: oDoc.total,
      created: oDoc.created,
      netTax: 0,
      products: oDoc?.cart?.products,
      cartId: oDoc.cart._id,
    };

    console.log(order.products);
    order = calTax(order);
    console.log(order);

    res.status(200).json({
      order,
    });
  } catch (error) {
    res.status(400).json({
      error,
    });
  }
});

router.delete('/cancel/:orderId', auth, async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findOne({ _id: orderId });
    const foundCart = await Cart.findOne({ _id: order.cart });

    increaseQuantity(foundCart.products);

    await Order.deleteOne({ _id: orderId });
    await Cart.deleteOne({ _id: order.cart });

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

router.put('/status/item/:itemId', auth, async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const orderId = req.body.orderId;
    const cartId = req.body.cartId;
    const status = req.body.status || 'Cancelled';

    const foundCart = await Cart.findOne({ 'products._id': itemId });
    const foundCartProduct = foundCart.products.find((p) => p._id == itemId);

    await Cart.updateOne(
      { 'products._id': itemId },
      {
        'products.$.status': status,
      }
    );

    if (status === 'Cancelled') {
      await Product.updateOne(
        { _id: foundCartProduct.product },
        { $inc: { quota: foundCartProduct.quota } }
      );

      const cart = await Cart.findOne({ _id: cartId });
      const items = cart.products.filter((item) => item.status === 'Cancelled');

      // Cancel order after cancelling all items
      if (cart.products.length === items.length) {
        await Order.deleteOne({ _id: orderId });
        await Cart.deleteOne({ _id: cartId });

        return res.status(200).json({
          success: true,
          orderCancelled: true,
          message: `${
            req.user.role === role.ROLES.Admin ? 'Order' : 'Your order'
          } is cancelled`,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Item cancelled!',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item status updated!',
    });
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

const increaseQuantity = (products) => {
  let bulkOptions = products.map((item) => {
    return {
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quota: item.quota } },
      },
    };
  });

  Product.bulkWrite(bulkOptions);
};

module.exports = router;
