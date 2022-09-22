import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/api.service';
import { ApiUrl } from '../../config/api-url';
import { PostType } from '../../config/common.enum';
import { BreadcrumbEntity } from '../../components/breadcrumb/breadcrumb.interface';
import {
  Post,
  PostArchiveDate,
  PostArchiveDateList,
  PostArchiveDateMap,
  PostEntity,
  PostList,
  PostQueryParam
} from './post.interface';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  constructor(private apiService: ApiService) {}

  getPosts(param: PostQueryParam): Observable<{ postList: PostList; breadcrumbs: BreadcrumbEntity[] }> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_POSTS), param)
      .pipe(map((res) => res?.data || {}));
  }

  getPostById(postId: string, referer?: string): Observable<Post> {
    const param: Record<string, any> = {};
    if (referer?.trim()) {
      param['ref'] = referer;
    }
    return this.apiService
      .httpGet(this.apiService.getApiUrlWithParam(ApiUrl.GET_POST_BY_ID, postId), param)
      .pipe(map((res) => res?.data || {}));
  }

  getPostBySlug(slug: string): Observable<Post> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_POST_BY_PARAM), {
        slug
      })
      .pipe(map((res) => res?.data || {}));
  }

  getPostsOfPrevAndNext(postId: string): Observable<{ prevPost: PostEntity; nextPost: PostEntity }> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_POSTS_OF_PREV_AND_NEXT), {
        postId
      })
      .pipe(map((res) => res?.data || {}));
  }

  getPostArchives({ showCount = false, limit = 10 }): Observable<PostArchiveDate[]> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_POST_ARCHIVES), {
        postType: PostType.POST,
        showCount: showCount ? 1 : 0,
        limit
      })
      .pipe(map((res) => res?.data || []));
  }

  transformArchiveDates(archiveDates: PostArchiveDate[]): PostArchiveDateList {
    const dateList: PostArchiveDateMap = {};
    (archiveDates || []).forEach((item) => {
      const year = item.dateText.split('/')[0];
      dateList[year] = dateList[year] || {};
      dateList[year].list = dateList[year].list || [];
      dateList[year].list.push(item);
      dateList[year].countByYear = dateList[year].countByYear || 0;
      dateList[year].countByYear += item.count || 0;
    });
    const yearList = Object.keys(dateList).sort((a, b) => (a < b ? 1 : -1));

    return {
      dateList,
      yearList
    };
  }

  getHotPosts(): Observable<PostEntity[]> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_POSTS_OF_HOT))
      .pipe(map((res) => res?.data || []));
  }

  getRandomPosts(): Observable<PostEntity[]> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_POSTS_OF_RANDOM))
      .pipe(map((res) => res?.data || []));
  }
}
