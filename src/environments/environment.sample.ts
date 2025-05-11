export const environment = {
  production: false,
  port: 4000,
  appId: 'xxxxxxxxxxxxxxxx',
  apiBase: 'https://api.ireadpay.com',
  cookie: {
    domain: 'localhost',
    expires: 3
  },
  domain: {
    post: 'blog.ifuyun.com',
    wallpaper: 'wallpaper.ifuyun.com',
    game: 'game.ifuyun.com',
    jigsaw: 'jigsaw.ifuyun.com',
    user: 'user.ifuyun.com',
    tool: 'tool.ifuyun.com'
  } as Record<string, string>,
  magazineUrl: 'https://www.struggleant.com'
};
