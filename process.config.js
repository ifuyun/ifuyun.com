module.exports = {
  apps: [
    {
      name: 'www.ifuyun.com',
      script: './dist/www/server/server.mjs'
    },
    {
      name: 'blog.ifuyun.com',
      script: './dist/blog/server/server.mjs'
    },
    {
      name: 'wallpaper.ifuyun.com',
      script: './dist/wallpaper/server/server.mjs'
    },
    {
      name: 'jigsaw.ifuyun.com',
      script: './dist/jigsaw/server/server.mjs'
    },
    {
      name: 'game.ifuyun.com',
      script: './dist/game/server/server.mjs'
    }
  ]
};
