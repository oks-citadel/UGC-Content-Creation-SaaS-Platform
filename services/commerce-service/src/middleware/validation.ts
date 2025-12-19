import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array(),
    });
    return;
  }
  next();
};

/**
 * Product validation rules
 */
export const validateProduct = [
  body('external_id').optional().isString(),
  body('name').isString().notEmpty(),
  body('description').optional().isString(),
  body('price').isNumeric().custom((value) => value >= 0),
  body('currency').optional().isString().isLength({ min: 3, max: 3 }),
  body('sku').optional().isString(),
  body('images').optional().isArray(),
  body('source').optional().isIn(['shopify', 'woocommerce', 'manual', 'api']),
  handleValidationErrors,
];

/**
 * Gallery validation rules
 */
export const validateGallery = [
  body('name').isString().notEmpty(),
  body('description').optional().isString(),
  body('layout').isIn(['grid', 'masonry', 'carousel', 'slider', 'fullscreen', 'story']),
  body('settings').optional().isObject(),
  body('theme').optional().isObject(),
  body('cta_settings').optional().isObject(),
  handleValidationErrors,
];

/**
 * Product tag validation rules
 */
export const validateProductTag = [
  body('content_id').isString().notEmpty(),
  body('product_id').isUUID(),
  body('gallery_content_id').optional().isUUID(),
  body('position_x').optional().isFloat({ min: 0, max: 1 }),
  body('position_y').optional().isFloat({ min: 0, max: 1 }),
  body('timestamp').optional().isNumeric(),
  body('label').optional().isString(),
  handleValidationErrors,
];

/**
 * Attribution event validation rules
 */
export const validateAttributionEvent = [
  body('type').isIn(['view', 'click', 'add_to_cart', 'purchase', 'share', 'like']),
  body('content_id').optional().isString(),
  body('product_id').optional().isUUID(),
  body('gallery_id').optional().isUUID(),
  body('order_id').optional().isUUID(),
  body('revenue').optional().isNumeric(),
  body('quantity').optional().isInt({ min: 1 }),
  body('session_id').optional().isString(),
  body('user_id').optional().isString(),
  handleValidationErrors,
];

/**
 * Checkout validation rules
 */
export const validateCheckout = [
  body('items').isArray().notEmpty(),
  body('items.*.product_id').isUUID(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('items.*.price').optional().isNumeric(),
  body('customer_data.email').optional().isEmail(),
  handleValidationErrors,
];

/**
 * Order processing validation rules
 */
export const validateProcessOrder = [
  body('session_token').isUUID(),
  body('customer_data.email').isEmail(),
  body('customer_data.name').optional().isString(),
  body('customer_data.phone').optional().isString(),
  body('customer_data.shipping_address').optional().isObject(),
  body('customer_data.billing_address').optional().isObject(),
  handleValidationErrors,
];

/**
 * UUID parameter validation
 */
export const validateUUID = (paramName: string = 'id') => [
  param(paramName).isUUID(),
  handleValidationErrors,
];

/**
 * Pagination validation
 */
export const validatePagination = [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  handleValidationErrors,
];

/**
 * Date range validation
 */
export const validateDateRange = [
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  handleValidationErrors,
];
