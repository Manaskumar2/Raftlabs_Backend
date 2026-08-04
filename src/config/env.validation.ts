import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  PORT: Joi.number().default(3000),
  CORS_ORIGIN: Joi.string().default('*'),
  STATUS_PREPARING_DELAY: Joi.number().default(10000),
  STATUS_DELIVERY_DELAY: Joi.number().default(10000),
  STATUS_DELIVERED_DELAY: Joi.number().default(10000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
});
