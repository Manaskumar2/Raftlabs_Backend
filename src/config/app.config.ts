import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  statusPreparingDelay: parseInt(
    process.env.STATUS_PREPARING_DELAY || '10000',
    10,
  ),
  statusDeliveryDelay: parseInt(
    process.env.STATUS_DELIVERY_DELAY || '10000',
    10,
  ),
  statusDeliveredDelay: parseInt(
    process.env.STATUS_DELIVERED_DELAY || '10000',
    10,
  ),
  nodeEnv: process.env.NODE_ENV || 'development',
}));
