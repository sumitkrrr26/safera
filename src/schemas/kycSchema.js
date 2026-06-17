const Joi = require('joi');

const kycSubmissionSchema = Joi.object({
  id_document_type: Joi.string()
    .valid('aadhaar', 'pan', 'passport')
    .required()
    .messages({
      'any.required': 'ID document type is required',
      'any.only': 'Must be aadhaar, pan, or passport',
    }),
  id_number: Joi.string()
    .required()
    .messages({
      'any.required': 'ID number is required',
    }),
  full_name_on_id: Joi.string()
    .min(2)
    .required(),
  date_of_birth_on_id: Joi.date()
    .max('now')
    .required(),
});

const kycApprovalSchema = Joi.object({
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

module.exports = {
  kycSubmissionSchema,
  kycApprovalSchema,
};
