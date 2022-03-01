import { Route, UrlSegment, UrlSegmentGroup } from '@angular/router';

export function postStandaloneUrlMatcher(url: UrlSegment[], group: UrlSegmentGroup, route: Route) {
  if (url.length !== 1 || (url.length > 1 && url[0].path !== 'post')) {
    return null;
  }
  if (url.length === 1 && !/^[a-zA-Z-_]+$/i.test(url[0].path)) {
    return null;
  }
  const slugs: string[] = url.map((u) => u.path);

  return {
    consumed: url,
    posParams: {
      postSlug: new UrlSegment(`/${slugs.join('/')}`, {})
    }
  };
}
