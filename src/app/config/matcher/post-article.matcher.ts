import { UrlMatchResult, UrlSegment } from '@angular/router';
import { REGEXP_ID, REGEXP_POST_NAME } from '../common.constant';

export function postArticleUrlMatcher(url: UrlSegment[]): UrlMatchResult | null {
  if (url.length !== 2 || url[0].path !== 'post') {
    return null;
  }
  if (REGEXP_ID.test(url[1].path)) {
    return {
      consumed: url,
      posParams: {
        postId: url[1]
      }
    };
  }
  if (REGEXP_POST_NAME.test(url[1].path)) {
    return {
      consumed: url,
      posParams: {
        postSlug: url[1]
      }
    };
  }
  return null;
}
