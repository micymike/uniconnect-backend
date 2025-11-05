const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const validateSignup = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('username').isLength({ min: 3 }).trim().escape(),
  handleValidationErrors
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  handleValidationErrors
];

const validateMeal = [
  body('title').notEmpty().trim().escape(),
  body('description').notEmpty().trim().escape(),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('location').notEmpty().trim().escape(),
  handleValidationErrors
];

const validateMarketProduct = [
  body('title').notEmpty().trim().escape(),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('category').notEmpty().trim().escape(),
  handleValidationErrors
];

module.exports = {
  validateSignup,
  validateLogin,
  validateMeal,
  validateMarketProduct,
  handleValidationErrors
};
