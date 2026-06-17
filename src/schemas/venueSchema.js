const Joi = require('joi');

const venueApplicationSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(200)
    .required(),
  address: Joi.string()
    .min(5)
    .max(500)
    .required(),
  city: Joi.string()
    .min(2)
    .max(100)
    .required(),
  latitude: Joi.number()
    .min(-90)
    .max(90)
    .required(),
  longitude: Joi.number()
    .min(-180)
    .max(180)
    .required(),
  price_tier: Joi.string()
    .valid('tier1', 'tier2', 'tier3')
    .required()
    .messages({
      'any.only': 'Price tier must be tier1 (₹100-500), tier2 (₹500-1500), or tier3 (₹1500+)',
    }),
  cuisine_type: Joi.string()
    .max(100)
    .required(),
  google_maps_url: Joi.string()
    .uri()
    .optional(),
  phone_number: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional(),
  website_url: Joi.string()
    .uri()
    .optional(),
});

const venueApprovalSchema = Joi.object({
  status: Joi.string()
    .valid('approved', 'rejected')
    .required(),
  rejection_reason: Joi.string()
    .when('status', {
      is: 'rejected',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
});

const venueSearchSchema = Joi.object({
  city: Joi.string()
    .optional(),
  price_tier: Joi.string()
    .valid('tier1', 'tier2', 'tier3')
    .optional(),
  cuisine_type: Joi.string()
    .optional(),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),
  offset: Joi.number()
    .integer()
    .min(0)
    .default(0),
});

module.exports = {
  venueApplicationSchema,
  venueApprovalSchema,
  venueSearchSchema,
};
