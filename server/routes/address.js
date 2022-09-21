const express = require('express');
const router = express.Router();
const Address = require('../models/address');
const auth = require('../middleware/auth');

router.post('/add', auth, (req, res) => {
  const user = req.user;
  const values = Object.assign(req.body, { user: user._id });

  const address = new Address(values);

  address.save((err, data) => {
    if (err) {
      return res.status(400).json({
        error: 'try again.',
      });
    }

    res.status(200).json({
      success: true,
      message: `added successfully!`,
      address: data,
    });
  });
});

router.get('/', auth, (req, res) => {
  Address.find({ user: req.user._id }, (err, data) => {
    if (err) {
      return res.status(400).json({
        error: 'try again.',
      });
    }

    res.status(200).json({
      addresses: data,
    });
  });
});

router.get('/:id', async (req, res) => {
  try {
    const aId = req.params.id;
    const aDoc = await Address.findOne({ _id: aId });

    if (!aDoc) {
      res.status(404).json({
        message: `not available`,
      });
    }

    res.status(200).json({
      address: aDoc,
    });
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const aId = req.params.id;
    const update = req.body;
    const query = { _id: aId };

    await Address.findOneAndUpdate(query, update, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: 'Address has been updated successfully!',
    });
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

router.delete('/delete/:id', (req, res) => {
  Address.deleteOne({ _id: req.params.id }, (err, data) => {
    if (err) {
      return res.status(400).json({
        error: 'try again.',
      });
    }

    res.status(200).json({
      success: true,
      message: `deleted!`,
      address: data,
    });
  });
});

module.exports = router;
