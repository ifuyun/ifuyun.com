import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, AppConfigService, ArchiveData, ArchiveDataMap, ArchiveList } from 'common/core';
import { BookType, PostType } from 'common/enums';
import { Post, PostEntity, PostList, PostQueryParam, PostRelatedParam, PostSearchItem } from 'common/interfaces';
import highlight from 'highlight.js';
import { BehaviorSubject, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private activePostId: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public activePostId$: Observable<string> = this.activePostId.asObservable();

  constructor(
    private readonly apiService: ApiService,
    private readonly appConfigService: AppConfigService
  ) {}

  getPosts(param: PostQueryParam): Observable<PostList> {
    return this.apiService
      .httpGet(ApiUrl.POSTS, {
        ...param,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || {}));
  }

  getPostsByBookId<T extends PostList | { posts: PostEntity[] }>(param: PostQueryParam): Observable<T> {
    return this.apiService
      .httpGet(ApiUrl.POST_LIST_BY_BOOK, {
        ...param,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || {}));
  }

  getHotPosts(): Observable<PostEntity[]> {
    return this.apiService
      .httpGet(ApiUrl.POST_HOT, {
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || []));
  }

  getRandomPosts(size: number, detail: boolean): Observable<PostEntity[]> {
    return this.apiService
      .httpGet(ApiUrl.POST_RANDOM, {
        size,
        detail: detail ? 1 : 0,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || []));
  }

  getRelatedPosts(param: PostRelatedParam): Observable<PostSearchItem[]> {
    return this.apiService
      .httpGet(ApiUrl.POST_RELATED, {
        ...param,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || []));
  }

  getPostArchives(showCount = false, limit = 10): Observable<ArchiveData[]> {
    return this.apiService
      .httpGet(ApiUrl.POST_ARCHIVES, {
        showCount: showCount ? 1 : 0,
        limit,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data?.archives || []));
  }

  getPostById(postId: string, postType: PostType, ref?: string): Observable<Post> {
    const payload: Record<string, any> = {
      postId,
      postType,
      appId: this.appConfigService.appId
    };
    if (ref?.trim()) {
      payload['ref'] = ref;
    }
    return this.apiService.httpGet(ApiUrl.POST, payload).pipe(map((res) => res?.data));
  }

  getPostBySlug(slug: string, postType: PostType, ref?: string): Observable<Post> {
    const payload: Record<string, any> = {
      slug,
      postType,
      appId: this.appConfigService.appId
    };
    if (ref?.trim()) {
      payload['ref'] = ref;
    }
    return this.apiService.httpGet(ApiUrl.POST, payload).pipe(map((res) => res?.data));
  }

  getPostsOfPrevAndNext(param: {
    postId?: string;
    postName?: string;
    postType?: PostType;
  }): Observable<{ prevPost: PostEntity; nextPost: PostEntity }> {
    return this.apiService
      .httpGet(ApiUrl.POST_PREV_AND_NEXT, {
        ...param,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || {}));
  }

  updateActivePostId(postId: string) {
    this.activePostId.next(postId);
  }

  getPostSource(post: Post): string {
    let source = post.post.postSource || '';
    if (post.book) {
      if ([BookType.BOOK, BookType.OTHER].includes(post.book.bookType)) {
        source = '《' + post.book.bookName + '》';
      } else {
        source = '《' + post.book.bookName + '》' + post.book.bookIssue;
      }
    }

    return source;
  }

  parseHTML(content: string, copyHTML: string) {
    let count = 0;
    const codeList: string[] = [];
    const result = content.replace(
      /<pre(?:\s+[^>]*)*>\s*<code(?:\s+[^>]*)?>([\s\S]*?)<\/code>\s*<\/pre>/gi,
      (preStr, codeStr: string) => {
        const langReg = /^<pre(?:\s+[^>]*)*\s+class="([^"]+)"(?:\s+[^>]*)*>/gi;
        const langResult = Array.from(preStr.matchAll(langReg));
        let langStr = '';
        let language = '';
        if (langResult.length > 0 && langResult[0].length === 2) {
          const langClass = langResult[0][1]
            .split(/\s+/i)
            .filter((item) => item.split('-')[0].toLowerCase() === 'language');
          if (langClass.length > 0) {
            langStr = langClass[0].split('-')[1] || '';
            if (langStr && highlight.getLanguage(langStr)) {
              language = langStr;
            }
          }
        }
        // unescape: ><&…, etc.
        const codeDecoded = codeStr
          .replace(/&lt;/gi, '<')
          .replace(/&gt;/gi, '>')
          .replace(/&amp;/gi, '&')
          .replace(/&hellip;/gi, '…');
        const lines = codeDecoded
          .split(/\r\n|\r|\n/i)
          .map((str, i) => `<li>${i + 1}</li>`)
          .join('');
        const codes = language
          ? highlight.highlight(codeDecoded, { language }).value
          : highlight.highlightAuto(codeDecoded).value;

        codeList.push(codeStr);

        return (
          `<pre class="i-code"${langStr ? ' data-lang="' + langStr + '"' : ''}>` +
          `<div class="i-code-info">` +
          `<span>${langStr}</span><span class="i-code-copy" data-i="${count++}">${copyHTML}</span>` +
          `</div>` +
          `<div class="i-code-body">` +
          `<ul class="i-code-lines">${lines}</ul>` +
          `<code class="i-code-html">${codes}</code>` +
          `</div>` +
          `</pre>`
        );
      }
    );

    return {
      content: result,
      codeList
    };
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
}
