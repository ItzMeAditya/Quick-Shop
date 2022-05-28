const express = require('express');
const { check, body } = require('express-validator/check');
const User = require('../models/user');

const authController = require('../controllers/auth');

const router = express.Router();

router.get ('/login',authController.getLogin);

router.get ('/signup',authController.getSignup);

router.post (
    '/login',
    [
        body('email')
          .isEmail()
          .withMessage('Invalid Email ! Please enter a valid email.')
          .normalizeEmail(),
        body('password', 'Invalid Password !')
          .isLength({ min: 5 })
          .isAlphanumeric()
          .trim()
    ],
    authController.postLogin);

router.post (
    '/signup',
    [
        check('email')
            .isEmail()
            .withMessage('Invalid Email ! Please enter a valid email.')
            .custom((value, { req }) => {
                return User.findOne({ email: value }).then(userDoc => {
                    if (userDoc) {
                        return Promise.reject(
                            'E-Mail exists already, please pick a different one.'
                        );
                    }
                });
            })
            .normalizeEmail(),
        body('password','Password must have to be atleast 6 characters long with only numbers and text allowed.')
            .isLength({min:6})
            .isAlphanumeric()
            .trim(),
        body('confirmPassword')
            .custom((value, {req})=> {
                if (value !== req.body.password){
                    throw new Error ('Passwords have to match!');
                }
                return true;
            })
            .trim()
    ],
    authController.postSignup
);

router.post ('/logout',authController.postLogout);

router.get ('/reset', authController.getReset);

router.post ('/reset', authController.postReset);

router.get ('/reset/:token', authController.getNewPassword);

router.post ('/new-password', authController.postNewPassword);

module.exports = router;