import { registerAs } from '@nestjs/config';

const ENV_CONFIG = () => ({
  isDev: process.env['ENV'] !== 'production',
  isProd: process.env['ENV'] === 'production',
  isCluster: process.env['IS_CLUSTER'] === 'true'
});

export default registerAs('env', ENV_CONFIG);
