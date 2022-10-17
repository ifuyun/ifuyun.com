import { registerAs } from '@nestjs/config';
import { environment } from '../../src/environments/environment';

const ENV_CONFIG = () => ({
  isDev: !environment.production,
  isProd: environment.production,
  isCluster: environment.isCluster
});

export default registerAs('env', ENV_CONFIG);
