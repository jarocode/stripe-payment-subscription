import { registerAs } from '@nestjs/config';

export default registerAs('db', () => ({
  port: process.env.MONGODB_URI,
}));