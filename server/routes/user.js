const express = require('express');
const router = express.Router();
const role = require('../middleware/findRole');
const auth = require('../middleware/auth');
const User = require('../models/user');

// Search a user by admin
router.get(
  '/search',
  auth,
  role.findRole(role.ROLES.Admin),
  async (req, res) => {
    try {
      const { search } = req.query;

      const regex = new RegExp(search, 'i');

      const users = await User.find(
        {
          $or: [{ name: { $regex: regex } }, { email: { $regex: regex } }],
        },
        // Suppresses password and _id field in output
        { password: 0, _id: 0 }
      ).populate('seller', 'name');

      res.status(200).json({
        users,
      });
    } catch (error) {
      res.status(400).json({
        error: 'try again.',
      });
    }
  }
);

// Get all users
router.get('/', auth, async (req, res) => {
  try {
    const user = req.user._id;
    // Suppresses password field in output
    const userDoc = await User.findById(user, { password: 0 });

    res.status(200).json({
      user: userDoc,
    });
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

// Update a user
router.put('/', auth, async (req, res) => {
  try {
    const updateQuery = req.body.profile;

    const userDoc = await User.findOneAndUpdate(
      { _id: req.user._id },
      updateQuery,
      {
        new: true,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated!',
      user: userDoc,
    });
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

module.exports = router;
