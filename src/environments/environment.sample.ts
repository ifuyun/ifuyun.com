// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
export const environment = {
  production: false,
  host: '/',
  isCluster: false,
  logLevel: 'TRACE',
  cookie: {
    domain: 'localhost',
    expires: 7,
    secret: '[cookie_secret]]'
  },
  api: {
    host: 'http://localhost:2008'
  },
  server: {
    host: 'localhost',
    port: 2008
  },
  adsense: {
    clientId: 'ca-pub-xxxxxxxxxxxxxxxx'
  }
};
