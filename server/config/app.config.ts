import { registerAs } from '@nestjs/config';
import { environment } from '../../src/environments/environment';

const APP_CONFIG = () => ({
  cookieSecret: environment.cookie.secret,
  host: environment.server.host || 'localhost',
  port: environment.server.port || 2008,
  api: { host: environment.api.host },
  logLevel: environment.logLevel || 'TRACE'
});

export default registerAs('app', APP_CONFIG);
