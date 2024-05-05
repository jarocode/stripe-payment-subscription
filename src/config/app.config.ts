import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: process.env.PORT ?? 5001,
  host: process.env.HOST ?? 'localhost',
}));