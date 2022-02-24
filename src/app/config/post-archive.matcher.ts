import { Route, UrlSegment, UrlSegmentGroup } from '@angular/router';

export function archiveUrlMatcher(url: UrlSegment[], group: UrlSegmentGroup, route: Route) {
  if (url.length < 2 || url.length > 4 || url[0].path !== 'archive') {
    return null;
  }
  let page = '';
  let month = '';
  if (!/^(19|2\d)\d{2}$/i.test(url[1].path)) {
    return null;
  }
  if (url[2]) {
    if (/^page-\d+$/i.test(url[2].path)) {
      page = url[2].path.split('-')[1];
    } else if (/^[1-9]|(0[1-9])|(1[0-2])$/i.test(url[2].path)) {
      if (url[3] && !/^page-\d+$/i.test(url[3].path)) {
        return null;
      }
      month = url[2].path;
      page = url[3] && url[3].path.split('-')[1] || '';
    } else {
      return null;
    }
  }
  const params: {
    [name: string]: UrlSegment;
  } = {
    year: new UrlSegment(url[1].path, {})
  };
  if (month) {
    params['month'] = new UrlSegment(month, {});
  }
  if (page) {
    params['page'] = new UrlSegment(page, {});
  }
  return {
    consumed: url,
    posParams: params
  };
}
