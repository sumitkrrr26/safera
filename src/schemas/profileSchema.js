const Joi = require('joi');

const profileUpdateSchema = Joi.object({
  bio: Joi.string()
    .max(500)
    .optional(),
  occupation: Joi.string()
    .max(100)
    .optional(),
  interests: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .optional(),
  looking_for: Joi.string()
    .valid('male', 'female', 'other')
    .optional(),
});

const profileCompleteSchema = Joi.object({
  bio: Joi.string()
    .max(500)
    .required(),
  occupation: Joi.string()
    .max(100)
    .required(),
  interests: Joi.array()
    .items(Joi.string().max(50))
    .min(3)
    .max(10)
    .required(),
  looking_for: Joi.string()
    .valid('male', 'female', 'other')
    .required(),
});

module.exports = {
  profileUpdateSchema,
  profileCompleteSchema,
};
