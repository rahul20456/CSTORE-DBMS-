const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Brand = require('../models/brand');
const Seller = require('../models/seller');
const User = require('../models/user');
const auth = require('../middleware/auth');
const role = require('../middleware/findRole');

// Add a new seller
router.post('/new', async (req, res) => {
  try {
    const name = req.body.name;
    const business = req.body.business;
    const phone = req.body.phone;
    const email = req.body.email;
    const brand = req.body.brand;
    const password = req.body.password;

    if (!name || !email || !password || !brand || !business || !phone) {
      return res.status(400).json({ error: 'Please enter all fields' });
    }

    const existingSeller = await Seller.findOne({ email });

    if (existingSeller) {
      return res
        .status(400)
        .json({ error: 'That email address is already in use.' });
    }

    const seller = new Seller({
      name,
      email,
      business,
      phone,
      brand,
    });

    const sDoc = await seller.save();

    const existingUser = await User.findOne({ email: sDoc.email });

    if (existingUser) {
      const sDoc = await Seller.findOne({
        email: sDoc.email,
      });

      await createBrand(sDoc);
      return await User.findOneAndUpdate(
        { _id: existingUser._id },
        {
          seller: sDoc._id,
          role: role.ROLES.Seller,
        },
        {
          new: true,
        }
      );
    } else {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      const user = new User({
        email: sDoc.email,
        name: sDoc.name,
        password: hash,
        seller: sDoc._id,
        role: role.ROLES.Seller,
      });

      await user.save();
    }

    await createBrand(sDoc);

    res.status(200).json({
      success: true,
      message: `Welcome aboard!`,
      seller: sDoc,
    });
  } catch (error) {
    return res.status(400).json({
      error: 'try again.',
    });
  }
});

// Get all sellers sort by created at
router.get('/list', auth, role.findRole(role.ROLES.Admin), async (req, res) => {
  try {
    const sellers = await Seller.find({}).sort('-created');

    res.status(200).json({
      sellers,
    });
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

// Delete a seller by id by admin
router.delete(
  '/delete/:id',
  auth,
  role.findRole(role.ROLES.Admin),
  async (req, res) => {
    try {
      const seller = await Seller.deleteOne({ _id: req.params.id });

      res.status(200).json({
        success: true,
        message: `Seller deleted!`,
        seller,
      });
    } catch (error) {
      res.status(400).json({
        error: 'try again.',
      });
    }
  }
);

// Create a brand of the seller
const createBrand = async ({ _id, brand, business }) => {
  const nBrand = new Brand({
    seller: _id,
    name: brand,
    description: business,
  });

  return await nBrand.save();
};

module.exports = router;
