import { Route, UrlSegment, UrlSegmentGroup } from '@angular/router';

export function taxonomyUrlMatcher(url: UrlSegment[], group: UrlSegmentGroup, route: Route) {
  const types = ['category', 'tag'];
  if (url.length < 2 || url.length > 3 || !types.includes(url[0].path)) {
    return null;
  }
  let page = '1';
  if (url[2]) {
    if (!/^page-\d+$/i.test(url[2].path)) {
      return null;
    }
    page = url[2].path.split('-')[1];
  }
  return {
    consumed: url,
    posParams: {
      [url[0].path]: new UrlSegment(url[1].path, {}),
      page: new UrlSegment(page, {})
    }
  };
}
