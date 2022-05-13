import { Route, UrlSegment, UrlSegmentGroup } from '@angular/router';

export function postPageUrlMatcher(url: UrlSegment[], group: UrlSegmentGroup, route: Route) {
  const nameReg = /^[a-zA-Z0-9]+(?:[~@$%&*\-_=+;:,]+[a-zA-Z0-9]+)*$/i;
  if (url.length > 2 || url.length < 1) {
    return null;
  }
  if (url.length === 1 && (!nameReg.test(url[0].path) || /^\d+$/i.test(url[0].path))) {
    return null;
  }
  if (url.length === 2 && (url[0].path !== 'post' || !nameReg.test(url[1].path))) {
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
