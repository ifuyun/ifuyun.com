<br/>
<p align="center">
  <a href="http://www.ifuyun.com/" title="心之所向，素履以往" target="_blank">
    <img src="src/assets/images/logo.png" height="90" alt="ifuyun.com logo" />
  </a>
</p>

Website of [ifuyun.com](http://www.ifuyun.com/), implementation of Wutong CMS.

[ifuyun.com](http://www.ifuyun.com/) is powered by [Angular Universal](https://angular.io/guide/universal), API services is provided by [Wutong CMS API](https://jihulab.com/fuyun/wutong-api).

## Related projects

- **RESTful API service for Wutong CMS:** [`Wutong CMS API`](https://jihulab.com/fuyun/wutong-api), powered by [`Nest.js`](https://nestjs.com/).
- **Wutong CMS admin site:** [`Wutong CMS Admin`](https://jihulab.com/fuyun/wutong-admin), powered by [`Angular`](https://angular.io/) and [`NG-ZORRO`](https://github.com/NG-ZORRO/ng-zorro-antd).

## Development setup

```bash
# Installation
$ npm i

# SSR mode
$ npm run dev:ssr
$ npm run serve:ssr
$ npm run build:ssr
$ npm run compress
$ npm run build:ssr:prod

# SPA mode
$ npm run start
$ npm run build
$ npm run watch

# Code scaffolding
$ ng g component|directive|pipe|service|class|guard|interface|enum|module name

# Lint & test
$ npm run lint
$ npm run test
```

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## License

Licensed under the [MIT](/LICENSE) License.
