const path = require('path');
const {body} = require('express-validator/check');
const express = require('express');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth , adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth , adminController.getProducts);

// /admin/add-product => POST
router.post(
    '/add-product',
    [
        body('title','Title should be atleast 3 characters long.')
            .isString()
            .isLength({min : 3})
            .trim(),
        body('price')
            .isFloat(),
        body('description','Description should be minimum 10 characaters long and maximum 400 characters long.')
            .isLength({min : 10, max:400})
            .trim()
    ], 
    isAuth , 
    adminController.postAddProduct
);

router.get('/edit-product/:productId', isAuth ,adminController.getEditProduct);

router.post(
    '/edit-product', 
    [
        body('title','Title should be atleast 3 characters long.')
            .isString()
            .isLength({min : 3})
            .trim(),
        body('price')
            .isFloat(),
        body('description','Description should be minimum 10 characaters long and maximum 400 characters long.')
            .isLength({min : 10, max:400})
            .trim()
    ],
    isAuth ,
    adminController.postEditProduct
);

router.post('/delete-product', isAuth ,adminController.postDeleteProduct);

module.exports = router;
