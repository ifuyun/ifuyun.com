import { Route, UrlSegment, UrlSegmentGroup } from '@angular/router';

export function postListUrlMatcher(url: UrlSegment[], group: UrlSegmentGroup, route: Route) {
  if (url.length !== 2 || url[0].path !== 'post') {
    return null;
  }
  if (!/^page-\d+$/i.test(url[1].path)) {
    return null;
  }
  return {
    consumed: url,
    posParams: {
      page: new UrlSegment(url[1].path.split('-')[1], {})
    }
  };
}
