import { Route, UrlSegment, UrlSegmentGroup } from '@angular/router';

export function postArticleUrlMatcher(url: UrlSegment[], group: UrlSegmentGroup, route: Route) {
  if (url.length !== 2 || url[0].path !== 'post') {
    return null;
  }
  if (!/^[a-zA-Z0-9]{16}$/i.test(url[1].path)) {
    return null;
  }
  return {
    consumed: url,
    posParams: {
      postId: url[1]
    }
  };
}
