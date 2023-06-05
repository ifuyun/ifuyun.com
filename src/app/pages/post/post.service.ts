import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BreadcrumbEntity } from '../../components/breadcrumb/breadcrumb.interface';
import { ApiUrl } from '../../config/api-url';
import { STORAGE_KEY_VOTED_POSTS } from '../../config/common.constant';
import { PostType } from '../../config/common.enum';
import { ApiService } from '../../core/api.service';
import { ArchiveData, ArchiveDataMap, ArchiveList, ResultList } from '../../core/common.interface';
import { Post, PostEntity, PostQueryParam } from './post.interface';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  constructor(private apiService: ApiService) {}

  getPosts(param: PostQueryParam): Observable<{ postList: ResultList<Post>; breadcrumbs: BreadcrumbEntity[] }> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_POSTS), param)
      .pipe(map((res) => res?.data || {}));
  }

  getPostById(postId: string, referer?: string): Observable<Post> {
    const param: Record<string, any> = {
      postId
    };
    if (referer?.trim()) {
      param['ref'] = referer;
    }
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_POST), param)
      .pipe(map((res) => res?.data || {}));
  }

  getPostBySlug(slug: string): Observable<Post> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_POST), {
        slug
      })
      .pipe(map((res) => res?.data || {}));
  }

  getPostsOfPrevAndNext(param: {
    postId?: string;
    postName?: string;
    postType?: PostType;
  }): Observable<{ prevPost: PostEntity; nextPost: PostEntity }> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_POSTS_OF_PREV_AND_NEXT), param)
      .pipe(map((res) => res?.data || {}));
  }

  getPostArchives({ showCount = false, limit = 10, postType = PostType.POST }): Observable<ArchiveData[]> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_POST_ARCHIVES), {
        postType,
        showCount: showCount ? 1 : 0,
        limit
      })
      .pipe(map((res) => res?.data?.archives || []));
  }

  transformArchives(archiveData: ArchiveData[]): ArchiveList {
    const dateList: ArchiveDataMap = {};
    (archiveData || []).forEach((item) => {
      const dates = item.dateValue.split('/');
      const year = dates[0];
      item.dateLabel = `${Number(dates[1])}月`;
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
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_POSTS_BY_RANDOM))
      .pipe(map((res) => res?.data || []));
  }

  checkPostVoteStatus<T extends Post | Post[]>(posts: T): T {
    const voted = (localStorage.getItem(STORAGE_KEY_VOTED_POSTS) || '').split(',');
    if (!Array.isArray(posts)) {
      return {
        ...posts,
        voted: voted.includes(posts.post.postId)
      };
    }
    return posts.map((item) => ({
      ...item,
      voted: voted.includes(item.post.postId)
    })) as T;
  }
}
