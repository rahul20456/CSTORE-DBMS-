const express = require('express');
const router = express.Router();
const Review = require('../models/review');
const Product = require('../models/product');
const auth = require('../middleware/auth');

// Add a review
router.post('/add', auth, (req, res) => {
  const user = req.user;

  const review = new Review(Object.assign(req.body, { user: user._id }));

  review.save((err, data) => {
    if (err) {
      return res.status(400).json({
        error: 'try again.',
      });
    }

    res.status(200).json({
      success: true,
      message: `Review added!`,
      review: data,
    });
  });
});

// Get all reviews
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find({})
      // Populate only user name
      .populate({
        path: 'user',
        select: 'name',
      })
      // Populate only product name
      .populate({
        path: 'product',
        select: 'name slug image',
      })
      .sort('-created');

    res.status(200).json({
      reviews,
    });
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

// Get all reviews by product
router.get('/:name', async (req, res) => {
  console.log(req.params.name);
  try {
    const product = await Product.findOne({ slug: req.params.name });

    if (!product) {
      return res.status(404).json({
        message: 'No product',
      });
    }
    console.log(product);

    const reviews = await Review.find({
      product: product._id,
    })
      .populate({
        path: 'user',
        select: 'name',
      })
      .sort('-created');

    res.status(200).json({
      reviews,
    });
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

// Update a review by id
router.put('/:id', async (req, res) => {
  try {
    const updateQuery = req.body;
    await Review.findOneAndUpdate({ _id: req.params.id }, updateQuery, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: 'review updated!',
    });
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

// Delete a review by id
router.delete('/delete/:id', async (req, res) => {
  try {
    const review = await Review.deleteOne({ _id: req.params.id });
    res.status(200).json({
      success: true,
      message: `review deleted!`,
      review,
    });
  } catch (error) {
    return res.status(400).json({
      error: 'try again.',
    });
  }
});

module.exports = router;
