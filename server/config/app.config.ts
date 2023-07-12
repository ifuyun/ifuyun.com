import { registerAs } from '@nestjs/config';

const APP_CONFIG = () => ({
  host: process.env['HOST'],
  port: process.env['PORT'],
  api: { host: process.env['API_HOST'] },
  logLevel: process.env['LOG_LEVEL'] || 'TRACE',
  cookieSecret: process.env['COOKIE_SECRET']
});

export default registerAs('app', APP_CONFIG);
