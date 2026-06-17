const Joi = require('joi');

const registerSchema = Joi.object({
  phone_number: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be 10 digits',
      'any.required': 'Phone number is required',
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email format',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required',
    }),
  first_name: Joi.string()
    .min(2)
    .required()
    .messages({
      'string.min': 'First name must be at least 2 characters',
      'any.required': 'First name is required',
    }),
  last_name: Joi.string()
    .min(2)
    .required()
    .messages({
      'string.min': 'Last name must be at least 2 characters',
      'any.required': 'Last name is required',
    }),
  gender: Joi.string()
    .valid('male', 'female', 'other')
    .required(),
  date_of_birth: Joi.date()
    .max('now')
    .required()
    .messages({
      'any.required': 'Date of birth is required',
    }),
  city: Joi.string()
    .min(2)
    .required(),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email format',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
});

const phoneVerificationSchema = Joi.object({
  phone_number: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),
});

const otpVerificationSchema = Joi.object({
  phone_number: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]{6}$/)
    .required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  phoneVerificationSchema,
  otpVerificationSchema,
};
