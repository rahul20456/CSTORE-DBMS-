const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/user', require('./user'));
router.use('/address', require('./address'));
router.use('/product', require('./product'));
router.use('/brand', require('./brand'));
router.use('/seller', require('./seller'));
router.use('/cart', require('./cart'));
router.use('/order', require('./order'));
router.use('/review', require('./review'));

module.exports = router;
