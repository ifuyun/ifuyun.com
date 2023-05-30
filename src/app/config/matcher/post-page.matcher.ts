import { UrlMatchResult, UrlSegment } from '@angular/router';
import { POST_SLUG_PREFIX_BLACKLIST, REGEXP_POST_NAME } from '../common.constant';

export function postPageUrlMatcher(url: UrlSegment[]): UrlMatchResult | null {
  // /a/b, /a/b/c, /a/b/c/d, etc.
  if (url.length !== 1) {
    return null;
  }
  // exists
  if (POST_SLUG_PREFIX_BLACKLIST.includes(url[0].path)) {
    return null;
  }
  // not a valid slug(/xxx)
  if (!REGEXP_POST_NAME.test(url[0].path)) {
    return null;
  }

  return {
    consumed: url,
    posParams: {
      postName: url[0]
    }
  };
}
