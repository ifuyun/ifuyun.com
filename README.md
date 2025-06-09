<br/>
<p align="center">
  <a href="https://www.ifuyun.com" title="心之所向，素履以往 - 浮云网" target="_blank">
    <img src="./public/favicon.png" height="90" alt="Logo of ifuyun.com" />
  </a>
</p>

A versatile content community that unites blogs, high-resolution wallpapers, wallpaper jigsaw puzzles, and classic NES mini-games into a one-stop hub for creativity and fun.

[ifuyun.com](https://www.ifuyun.com) is powered by [Fuyun Tech](https://www.ireadpay.com)'s [Wutong CMS](https://admin.ireadpay.com/auth/login?appId=00m3ln4mfe58zyk1).

## Monorepos

- **Home:** [`www.ifuyun.com`](https://www.ifuyun.com)
- **Blog:** [`blog.ifuyun.com`](https://blog.ifuyun.com)
- **Wallpapers:** [`wallpaper.ifuyun.com`](https://wallpaper.ifuyun.com)
- **Wallpaper Jigsaw Puzzles:** [`jigsaw.ifuyun.com`](https://jigsaw.ifuyun.com)
- **NES Games:** [`game.ifuyun.com`](https://game.ifuyun.com)

## Related projects

- **RESTful API service for Wutong CMS:** [`Wutong CMS API`](https://www.ireadpay.com), powered by [`Nest.js`](https://nestjs.com).
- **Wutong CMS admin app:** [`Wutong CMS Admin`](https://admin.ireadpay.com), powered by [`Angular`](https://angular.dev) and [`NG-ZORRO`](https://github.com/NG-ZORRO/ng-zorro-antd).
- **Wutong CMS rich text editor:**[`Wutong Editor`](https://bitbucket.org/ifuyun/tinymce), powered by [`TinyMCE`](https://www.tiny.cloud).

## Development setup

```bash
# Installation
$ npm i

# Develop
$ npm run start:[app]
$ npm run build
$ npm run build:[app]
$ npm run build:gulp
$ npm run build:gulp:[app]
$ npm run build:prod
$ npm run build:prod:[app]
$ npm run build:zip
$ npm run build:zip:[app]
$ npm run watch:[app]
$ npm run serve:ssr:[app]

# Code scaffolding
$ ng g component|directive|pipe|service|class|guard|interface|enum|module name
$ ng g --help

# Lint & test
$ npm run lint
$ npm run format
$ npm run test
$ ng test
$ ng e2e

# Deploy
$ npm run deploy:zip
$ npm run deploy:zip:[app]
$ npm run deploy:local
$ npm run deploy:remote
```

## Further help

For more information about the project, please visit the [Evolution](https://www.ifuyun.com/evolution) page; for any feedback or suggestions, please visit the [Contact](https://www.ifuyun.com/contactus) page.

## License

Licensed under the [MIT](/LICENSE) License.
