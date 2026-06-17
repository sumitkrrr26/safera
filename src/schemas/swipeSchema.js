const Joi = require('joi');

const swipeSchema = Joi.object({
  swiped_on_id: Joi.number()
    .integer()
    .required(),
  swipe_type: Joi.string()
    .valid('like', 'pass')
    .required(),
});

module.exports = {
  swipeSchema,
};
