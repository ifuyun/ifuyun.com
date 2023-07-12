// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
export const environment = {
  production: false,
  host: '/',
  cookie: {
    domain: 'localhost',
    expires: 7,
    secret: '[cookie_secret]]'
  },
  api: {
    host: 'http://localhost:2016'
  }
};
