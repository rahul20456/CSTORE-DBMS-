const express = require('express');
const router = express.Router();
const Brand = require('../models/brand');
const auth = require('../middleware/auth');
const role = require('../middleware/findRole');

router.post('/add', auth, role.findRole(role.ROLES.Admin), async (req, res) => {
  try {
    const name = req.body.name;
    const description = req.body.description;

    if (!description || !name) {
      return res
        .status(400)
        .json({ error: 'You must enter description & name.' });
    }

    const brand = new Brand({
      name,
      description,
    });

    const bDoc = await brand.save();

    res.status(200).json({
      success: true,
      message: `added successfully!`,
      brand: bDoc,
    });
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

router.get('/list', async (req, res) => {
  try {
    const brands = await Brand.find({}).populate('seller', 'name');
    res.status(200).json({
      brands,
    });
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

router.get(
  '/',
  auth,
  role.findRole(role.ROLES.Admin, role.ROLES.Seller),
  async (req, res) => {
    try {
      let brands = null;
      if (req.user.seller) {
        brands = await Brand.find({
          seller: req.user.seller,
        }).populate('seller', 'name');
      } else {
        brands = await Brand.find({}).populate('seller', 'name');
      }

      res.status(200).json({
        brands,
      });
    } catch (error) {
      res.status(400).json({
        error: 'try again.',
      });
    }
  }
);

// Fetch brands of a seller
router.get(
  '/all',
  auth,
  role.findRole(role.ROLES.Admin, role.ROLES.Seller),
  async (req, res) => {
    try {
      let brands = null;

      console.log(req.user);

      if (req.user.seller) {
        brands = await Brand.find(
          {
            seller: req.user.seller,
          },
          'name'
        );
      } else {
        brands = await Brand.find({}, 'name');
      }

      res.status(200).json({
        brands,
      });
    } catch (error) {
      res.status(400).json({
        error: 'qweqe',
      });
    }
  }
);

router.put(
  '/:id',
  auth,
  role.findRole(role.ROLES.Admin, role.ROLES.Seller),
  async (req, res) => {
    try {
      const bId = req.params.id;
      const updateQuery = req.body.brand;
      const query = { _id: bId };

      await Brand.findOneAndUpdate(query, updateQuery, {
        new: true,
      });

      res.status(200).json({
        success: true,
        message: 'updated!',
      });
    } catch (error) {
      res.status(400).json({
        error: 'try again.',
      });
    }
  }
);

router.get('/:bId', async (req, res) => {
  try {
    const bId = req.params.bId;
    const bDoc = await Brand.findOne({ _id: bId });
    if (!bDoc) {
      res.status(404).json({
        message: `not found`,
      });
    }
    res.status(200).json({
      brand: bDoc,
    });
  } catch (error) {
    res.status(400).json({
      error: 'try again',
    });
  }
});

module.exports = router;
