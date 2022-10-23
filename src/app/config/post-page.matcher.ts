import { UrlSegment } from '@angular/router';
import { POST_SLUG_PREFIX_BLACKLIST } from './constants';

export function postPageUrlMatcher(url: UrlSegment[]) {
  const nameReg = /^[a-zA-Z0-9]+(?:[~@$%&*\-_=+;:,]+[a-zA-Z0-9]+)*$/i;
  // /a/b/c, /a/b/c/d, etc.
  if (url.length > 2 || url.length < 1) {
    return null;
  }
  // exists
  if (POST_SLUG_PREFIX_BLACKLIST.includes(url[0].path)) {
    return null;
  }
  // not a valid slug(/xxx), or is a page number('/2')
  if (url.length === 1 && (!nameReg.test(url[0].path) || /^\d+$/i.test(url[0].path))) {
    return null;
  }
  // /a/b, /post/xxx
  if (url.length === 2 && (url[0].path !== 'post' || !nameReg.test(url[1].path))) {
    return null;
  }
  // /xxx, /post/yyy
  const slugs: string[] = url.map((u) => u.path);

  return {
    consumed: url,
    posParams: {
      postSlug: new UrlSegment(`/${slugs.join('/')}`, {})
    }
  };
}
