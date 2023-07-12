import { registerAs } from '@nestjs/config';
import { environment } from '../../src/environments/environment';

const APP_CONFIG = () => ({
  cookieSecret: environment.cookie.secret,
  host: process.env['HOST'],
  port: process.env['PORT'],
  api: { host: process.env['API_HOST'] },
  logLevel: process.env['LOG_LEVEL'] || 'TRACE'
});

export default registerAs('app', APP_CONFIG);
