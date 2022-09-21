const express = require('express');
const router = express.Router();

const Product = require('../models/product');
const Brand = require('../models/brand');
const auth = require('../middleware/auth');
const role = require('../middleware/findRole');
const checkAuth = require('../checkAuth');

// Get all products by slug
router.get('/search/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;

    const pDoc = await Product.findOne({ slug }).populate({
      path: 'brand',
    });

    if (!pDoc) {
      return res.status(404).json({
        message: 'No product found.',
      });
    }

    res.status(200).json({
      product: pDoc,
    });
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

// get all products by name
router.get('/search/:name', async (req, res) => {
  try {
    const name = req.params.name;

    const pDoc = await Product.find(
      { name: { $regex: new RegExp(name), $options: 'is' } },
      // Suppresses _id field and inclide name, slug, image, price field in output
      { name: 1, slug: 1, image: 1, price: 1, _id: 0 }
    );

    if (pDoc.length > 0) {
      return res.status(200).json({
        products: pDoc,
      });
    }
    res.status(404).json({
      message: 'No product found.',
    });
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

// get all products
router.post('/list', async (req, res) => {
  try {
    let { sortOrder, stars, max, min } = req.body;

    const query = [
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brands',
        },
      },
      {
        $unwind: {
          path: '$brands',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          'brand.name': '$brands.name',
          'brand._id': '$brands._id',
        },
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'product',
          as: 'reviews',
        },
      },
      {
        $addFields: {
          totalRatings: { $sum: '$reviews.stars' },
          totalReviews: { $size: '$reviews' },
        },
      },
      {
        $addFields: {
          averageRating: {
            $cond: [
              { $eq: ['$totalReviews', 0] },
              0,
              { $divide: ['$totalRatings', '$totalReviews'] },
            ],
          },
        },
      },
      {
        $match: {
          price: { $gte: min, $lte: max },
          averageRating: { $gte: stars },
        },
      },
      {
        $project: {
          brands: 0,
          reviews: 0,
        },
      },
    ];

    const count = await Product.aggregate(query);
    const sortQuery = [{ $sort: sortOrder }];
    const products = await Product.aggregate(query.concat(sortQuery));

    res.status(200).json({
      products: products,
      totalProducts: count.length,
    });
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

// List all the products of a brand
router.get('/list/brand/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    const brand = await Brand.findOne({ slug });

    if (!brand) {
      return res.status(404).json({
        message: `no brand found`,
      });
    }

    const authorized = await checkAuth(req);

    if (authorized) {
      const products = await Product.aggregate([
        {
          $match: {
            // Match the brand
            brand: brand._id,
          },
        },
        {
          $lookup: {
            // Left outer join of brand with product
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brands',
          },
        },
        {
          // Deconstructs the brands
          $unwind: '$brands',
        },
        {
          // Add the brand name and id to the product
          $addFields: {
            'brand.name': '$brands.name',
            'brand._id': '$brands._id',
          },
        },
        // Exclude this field
        { $project: { brands: 0 } },
      ]);

      res.status(200).json({
        products: products.reverse(),
        totalProducts: products.length,
      });
    } else {
      const products = await Product.find({
        brand: brand._id,
      }).populate('brand', 'name');

      res.status(200).json({
        products: products.reverse(),
        totalProducts: products.length,
      });
    }
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

// Returns all products name
router.get('/all', auth, async (req, res) => {
  try {
    const products = await Product.find({}, 'name');
    res.status(200).json({
      products,
    });
  } catch (error) {
    res.status(400).json({
      error: 'try again.',
    });
  }
});

// Add a product
router.post(
  '/add',
  auth,
  role.findRole(role.ROLES.Admin, role.ROLES.Seller),
  async (req, res) => {
    try {
      const name = req.body.name;
      const description = req.body.description;
      const image = req.body.image;
      const quota = req.body.quota;
      const price = req.body.price;
      const brand = req.body.brand;

      if (!description || !name || !quota || !price || !brand || !image) {
        return res.status(400).json({ error: 'Please enter all the fields' });
      }

      const existingProduct = await Product.findOne({ name });

      if (existingProduct) {
        return res.status(400).json({ error: 'Change product name' });
      }

      const product = new Product({
        name,
        description,
        quota,
        price,
        brand,
        image,
      });

      const savedProduct = await product.save();

      res.status(200).json({
        success: true,
        message: `Product added!`,
        product: savedProduct,
      });
    } catch (error) {
      return res.status(400).json({
        error: 'try again.',
      });
    }
  }
);

// Fetch all products
router.get(
  '/',
  auth,
  role.findRole(role.ROLES.Admin, role.ROLES.Seller),
  async (req, res) => {
    try {
      let products = [];

      const seller = req.user.seller;

      if (seller) {
        const brands = await Brand.find({
          seller,
        }).populate('seller', '_id');

        const brandId = brands[0]['_id'];

        products = await Product.find({})
          .populate({
            path: 'brand',
            populate: {
              path: 'seller',
              model: 'Seller',
            },
          })
          .where('brand', brandId);
      } else {
        products = await Product.find({}).populate({
          path: 'brand',
          populate: {
            path: 'seller',
            model: 'Seller',
          },
        });
      }

      res.status(200).json({
        products,
      });
    } catch (error) {
      res.status(400).json({
        error: 'try again.',
      });
    }
  }
);

// Fetch a product by its id
router.get(
  '/:id',
  auth,
  role.findRole(role.ROLES.Admin, role.ROLES.Seller),
  async (req, res) => {
    try {
      const productId = req.params.id;
      let pDoc = null;

      const seller = req.user.seller;

      if (seller) {
        const brands = await Brand.find({
          seller,
        }).populate('seller', '_id');

        const brandId = brands[0]['_id'];

        pDoc = await Product.findOne({ _id: productId })
          .populate({
            path: 'brand',
            select: 'name',
          })
          .where('brand', brandId);
      } else {
        pDoc = await Product.findOne({ _id: productId }).populate({
          path: 'brand',
          select: 'name',
        });
      }

      if (!pDoc) {
        return res.status(404).json({
          message: 'No product found.',
        });
      }

      res.status(200).json({
        product: pDoc,
      });
    } catch (error) {
      res.status(400).json({
        error: 'try again.',
      });
    }
  }
);

// Update a product
router.put(
  '/:id',
  auth,
  role.findRole(role.ROLES.Admin, role.ROLES.Seller),
  async (req, res) => {
    try {
      const productId = req.params.id;
      const update = req.body.product;
      const query = { _id: productId };

      await Product.findOneAndUpdate(query, update, {
        new: true,
      });

      res.status(200).json({
        success: true,
        message: 'Product updated!',
      });
    } catch (error) {
      res.status(400).json({
        error: 'try again.',
      });
    }
  }
);

// Delete a product
router.delete(
  '/delete/:id',
  auth,
  role.findRole(role.ROLES.Admin, role.ROLES.Seller),
  async (req, res) => {
    try {
      const product = await Product.deleteOne({ _id: req.params.id });

      res.status(200).json({
        success: true,
        message: `Product deleted!`,
        product,
      });
    } catch (error) {
      res.status(400).json({
        error: 'try again.',
      });
    }
  }
);

module.exports = router;
