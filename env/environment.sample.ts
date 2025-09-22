export const environment = {
  production: false,
  apps: {
    www: {
      port: 6001,
      url: 'http://localhost:6001'
    },
    blog: {
      port: 6002,
      url: 'http://localhost:6002'
    },
    wallpaper: {
      port: 6003,
      url: 'http://localhost:6003'
    },
    jigsaw: {
      port: 6004,
      url: 'http://localhost:6004'
    },
    game: {
      port: 6005,
      url: 'http://localhost:6005'
    }
  },
  appId: 'xxxxxxxxxxxxxxxx',
  apiBase: 'https://api.ireadpay.com',
  cookie: {
    domain: 'localhost',
    expires: 3
  },
  magazineUrl: 'https://www.struggleant.com',
  emulator: {
    basePath: '/assets/game/',
    loaderPath: '/assets/game/loader.min.js'
  }
};
