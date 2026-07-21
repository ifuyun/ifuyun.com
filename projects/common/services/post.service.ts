import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, AppConfigService, ArchiveData } from 'common/core';
import { BookType, ContentType } from 'common/enums';
import { PostEntity, PostList, PostModel, PostQueryParam, PostSearchItem, PostVo } from 'common/interfaces';
import highlight from 'highlight.js';
import { BehaviorSubject, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private activePostId: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public activePostId$: Observable<string> = this.activePostId.asObservable();

  private activePost: BehaviorSubject<PostVo | null> = new BehaviorSubject<PostVo | null>(null);
  public activePost$: Observable<PostVo | null> = this.activePost.asObservable();

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

  getRelatedPosts(id: string): Observable<PostSearchItem[]> {
    return this.apiService
      .httpGet(ApiUrl.POST_RELATED, {
        id,
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

  getPostById(id: string, contentType: ContentType, ref?: string): Observable<PostVo> {
    const payload: Record<string, any> = {
      id,
      contentType,
      appId: this.appConfigService.appId
    };
    if (ref?.trim()) {
      payload['ref'] = ref;
    }
    return this.apiService.httpGet(ApiUrl.POST, payload).pipe(map((res) => res?.data));
  }

  getPostBySlug(slug: string, contentType: ContentType, ref?: string): Observable<PostVo> {
    const payload: Record<string, any> = {
      slug,
      contentType,
      appId: this.appConfigService.appId
    };
    if (ref?.trim()) {
      payload['ref'] = ref;
    }
    return this.apiService.httpGet(ApiUrl.POST, payload).pipe(map((res) => res?.data));
  }

  getPostsOfPrevAndNext(param: {
    id?: string;
    slug?: string;
    contentType?: ContentType;
  }): Observable<{ prevPost: PostModel; nextPost: PostModel }> {
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

  updateActivePost(post: PostVo) {
    this.activePost.next(post);
  }

  getPostSource(post: PostVo): string {
    let source = post.source || '';
    if (post.book) {
      if ([BookType.BOOK, BookType.OTHER].includes(post.book.type)) {
        source = '《' + post.book.name + '》';
      } else {
        source = '《' + post.book.name + '》' + post.book.issue;
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
        const langReg = /^<pre[^>]*>\s*<code(?:\s+[^>]*)*\s+class="([^"]+)"(?:\s+[^>]*)*>/gi;
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
}
