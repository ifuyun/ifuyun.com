import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import highlight from 'highlight.js';
import { isEmpty, uniq } from 'lodash';
import { NzImageService } from 'ng-zorro-antd/image';
import { ClipboardService } from 'ngx-clipboard';
import * as QRCode from 'qrcode';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { CommentObjectType } from '../../../components/comment/comment.enum';
import { CommentService } from '../../../components/comment/comment.service';
import {
  APP_ID,
  PATH_WECHAT_CARD,
  PATH_WECHAT_REWARD,
  REGEXP_ID,
  STORAGE_KEY_VOTED_POSTS
} from '../../../config/common.constant';
import { PostType, VoteType, VoteValue } from '../../../config/common.enum';
import { Message } from '../../../config/message.enum';
import { ResponseCode } from '../../../config/response-code.enum';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { MessageService } from '../../../core/message.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { PlatformService } from '../../../core/platform.service';
import { UrlService } from '../../../core/url.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { decodeEntities } from '../../../helpers/entities';
import { FavoriteType } from '../../../interfaces/favorite.enum';
import { ActionObjectType, ActionType } from '../../../interfaces/log.enum';
import { OptionEntity } from '../../../interfaces/option.interface';
import { TagEntity } from '../../../interfaces/tag.interface';
import { TaxonomyEntity } from '../../../interfaces/taxonomy.interface';
import { TenantAppModel } from '../../../interfaces/tenant-app.interface';
import { Guest, UserModel } from '../../../interfaces/user.interface';
import { VoteEntity } from '../../../interfaces/vote.interface';
import { FavoriteService } from '../../../services/favorite.service';
import { LogService } from '../../../services/log.service';
import { OptionService } from '../../../services/option.service';
import { TenantAppService } from '../../../services/tenant-app.service';
import { VoteService } from '../../../services/vote.service';
import { UserService } from '../../user/user.service';
import { Post, PostEntity, PostModel } from '../post.interface';
import { PostService } from '../post.service';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: [],
  encapsulation: ViewEncapsulation.None,
  providers: [DestroyService]
})
export class PostComponent extends PageComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() postType: PostType = PostType.POST;
  @ViewChild('postEle', { static: false }) postEle!: ElementRef;

  readonly wechatCardPath = PATH_WECHAT_CARD;

  commentObjectType = CommentObjectType.POST;
  isPost = false;
  isMobile = false;
  isLoggedIn = false;
  user!: UserModel;
  pageIndex = '';
  prevPost: PostEntity | null = null;
  nextPost: PostEntity | null = null;
  post!: PostModel;
  postMeta: Record<string, any> = {};
  postCategories: TaxonomyEntity[] = [];
  postTags: TagEntity[] = [];
  isFavorite = false;
  showCrumb = true;
  postVoted = false;
  voteLoading = false;
  favoriteLoading = false;
  showPayMask = false;
  loginModalVisible = false;

  private readonly copyHTML = '<i class="icon icon-copy"></i>Copy code';
  private readonly copiedHTML = '<i class="icon icon-check-lg"></i>Copied!';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private breadcrumbs: BreadcrumbEntity[] = [];
  private postId = '';
  private postSlug = '';
  private unlistenImgClick!: () => void;
  private referrer = '';
  private commentUser: Guest | null = null;

  constructor(
    private destroy$: DestroyService,
    private route: ActivatedRoute,
    private platform: PlatformService,
    private userAgentService: UserAgentService,
    private metaService: MetaService,
    private commonService: CommonService,
    private breadcrumbService: BreadcrumbService,
    private urlService: UrlService,
    private tenantAppService: TenantAppService,
    private optionService: OptionService,
    private userService: UserService,
    private postService: PostService,
    private commentService: CommentService,
    private voteService: VoteService,
    private favoriteService: FavoriteService,
    private imageService: NzImageService,
    private message: MessageService,
    private renderer: Renderer2,
    private clipboardService: ClipboardService,
    private logService: LogService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.isPost = this.postType === PostType.POST;
    this.commentObjectType = CommentObjectType.POST;

    this.updatePageOptions();

    combineLatest([
      this.tenantAppService.appInfo$,
      this.optionService.options$,
      this.route.params,
      this.urlService.urlInfo$
    ])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options, params, url]) => {
        this.appInfo = appInfo;
        this.options = options;
        this.referrer = url.previous;

        const postName = params['postName']?.trim();
        if (!postName) {
          this.commonService.redirectToNotFound();
          return;
        }
        if (REGEXP_ID.test(postName)) {
          this.postId = postName;
          this.fetchPost();
          this.commentService.updateObjectId(this.postId);
        } else {
          this.postSlug = postName;
          this.fetchPage();
        }
      });
    this.userService.loginUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user = user;
      this.isLoggedIn = !!user.userId;

      this.initPayMaskFlag();
    });
  }

  ngAfterViewInit() {
    if (this.platform.isBrowser) {
      const commentUser = this.userService.getCommentUser();
      if (commentUser) {
        this.commentUser = { ...commentUser };
      }
    }
    this.unlistenImgClick = this.renderer.listen(this.postEle.nativeElement, 'click', (e: MouseEvent) => {
      if (e.target instanceof HTMLImageElement) {
        this.imageService.preview([
          {
            src: e.target.src
          }
        ]);
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }

  ngOnDestroy() {
    this.unlistenImgClick();
  }

  votePost(like: boolean) {
    if (this.postVoted || this.voteLoading) {
      return;
    }
    let voteType: VoteType;
    switch (this.postType) {
      case PostType.PAGE:
        voteType = VoteType.PAGE;
        break;
      default:
        voteType = VoteType.POST;
    }
    const voteData: VoteEntity = {
      objectId: this.postId,
      value: like ? VoteValue.LIKE : VoteValue.DISLIKE,
      type: voteType,
      appId: APP_ID
    };
    if (this.commentUser && this.commentUser.name) {
      voteData.user = this.commentUser;
    }
    this.voteLoading = true;
    this.voteService
      .saveVote(voteData)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.voteLoading = false;
        if (res.code === ResponseCode.SUCCESS) {
          this.post.postLikes = res.data.likes;
          this.postVoted = true;

          if (!this.isLoggedIn) {
            const likedPosts = (localStorage.getItem(STORAGE_KEY_VOTED_POSTS) || '').split(',');
            likedPosts.push(this.postId);
            localStorage.setItem(STORAGE_KEY_VOTED_POSTS, uniq(likedPosts.filter((item) => !!item)).join(','));
          }
        }
      });
  }

  showReward() {
    const previewRef = this.imageService.preview([
      {
        src: PATH_WECHAT_REWARD
      }
    ]);
    this.commonService.addPaddingToImagePreview(previewRef.previewInstance.imagePreviewWrapper);
  }

  showShareQrcode() {
    const siteUrl = this.appInfo.appUrl.replace(/\/$/i, '');
    const postGuid = this.post.postGuid.replace(/^\//i, '');
    const shareUrl = siteUrl + '/' + postGuid + '?ref=qrcode';

    QRCode.toCanvas(shareUrl, {
      width: 320,
      margin: 0
    })
      .then((canvas) => {
        const previewRef = this.imageService.preview([
          {
            src: canvas.toDataURL()
          }
        ]);
        this.commonService.addPaddingToImagePreview(previewRef.previewInstance.imagePreviewWrapper);
      })
      .catch((err) => this.message.error(err));
  }

  addFavorite() {
    if (this.favoriteLoading || this.isFavorite) {
      return;
    }
    if (!this.isLoggedIn) {
      this.message.error(Message.ADD_FAVORITE_MUST_LOGIN);
      return;
    }
    this.favoriteLoading = true;
    this.favoriteService
      .addFavorite(this.postId, FavoriteType.POST)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.favoriteLoading = false;
        if (res) {
          this.message.success(Message.ADD_FAVORITE_SUCCESS);
          this.isFavorite = true;
        }
      });
  }

  onPostClick(e: MouseEvent) {
    const $target = e.target as HTMLElement;
    if ($target.classList.contains('i-code-copy')) {
      e.preventDefault();
      e.stopPropagation();

      if (!this.isLoggedIn) {
        this.showLoginModal();
        return;
      }
      const $parent = $target.parentNode?.parentNode;
      if ($parent) {
        const $code = $parent.querySelector('.i-code-text');
        const codeText = $code?.innerHTML;
        if (codeText) {
          this.clipboardService.copy(decodeEntities(codeText));
          $target.innerHTML = this.copiedHTML;

          this.logService
            .logAction({
              action: ActionType.COPY_CODE,
              objectType: ActionObjectType.POST,
              objectId: this.postId
            })
            .subscribe();

          window.setTimeout(() => {
            $target.innerHTML = this.copyHTML;
          }, 2000);
        }
      }
    }
  }

  showLoginModal() {
    this.loginModalVisible = true;
  }

  closeLoginModal() {
    this.loginModalVisible = false;
  }

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.pageIndex);
  }

  protected updatePageOptions(): void {
    this.commonService.updatePageOptions({
      showHeader: true,
      showFooter: true,
      showMobileHeader: true,
      showMobileFooter: true
    });
  }

  private initMeta() {
    const keywords: string[] = (this.options['post_keywords'] || '').split(',');
    this.metaService.updateHTMLMeta({
      title: `${this.post.postTitle} - ${this.appInfo.appName}`,
      description: this.post.postExcerpt,
      keywords: uniq(this.postTags.map((item) => item.tagName).concat(keywords)).join(','),
      author: this.options['site_author']
    });
  }

  private fetchPost() {
    this.postService
      .getPostById(this.postId, this.postType, this.referrer)
      .pipe(takeUntil(this.destroy$))
      .subscribe((post) => {
        if (post && post.post && post.post.postId) {
          this.initData(post);
        }
      });
    this.postService
      .getPostsOfPrevAndNext({
        postId: this.postId,
        postType: this.postType
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.prevPost = res.prevPost;
        this.nextPost = res.nextPost;
      });
  }

  private fetchPage() {
    this.postService
      .getPostBySlug(this.postSlug, this.postType)
      .pipe(takeUntil(this.destroy$))
      .subscribe((post) => {
        if (post && post.post && post.post.postId) {
          this.initData(post);
          this.commentService.updateObjectId(post.post.postId);
        }
      });
    if (this.postType !== PostType.PAGE) {
      this.postService
        .getPostsOfPrevAndNext({
          postName: this.postSlug,
          postType: this.postType
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          this.prevPost = res.prevPost;
          this.nextPost = res.nextPost;
        });
    }
  }

  private initData(post: Post) {
    this.post = post.post;
    this.postId = this.post.postId;
    this.postMeta = post.meta;
    this.postCategories = post.categories;
    this.postTags = post.tags;
    this.isFavorite = post.isFavorite;
    this.postVoted = post.isVoted;
    this.initPayMaskFlag();

    if (this.postType !== PostType.PAGE) {
      const urlType = 'post';
      const pageType = '文章';

      this.pageIndex = 'post';
      this.showCrumb = true;
      this.breadcrumbs = (post.breadcrumbs || []).map((item) => ({
        ...item,
        url: `/${urlType}/category/${item.slug}`
      }));
      this.breadcrumbs.unshift({
        label: pageType,
        tooltip: `${pageType}列表`,
        url: `/${urlType}`,
        isHeader: false
      });
      this.breadcrumbService.updateBreadcrumb(this.breadcrumbs);
    } else {
      this.pageIndex = this.post.postName;
      this.showCrumb = false;
    }

    !this.postVoted && this.checkPostVoted();
    this.updateActivePage();
    this.initMeta();
    this.parseHtml();
  }

  private initPayMaskFlag() {
    if (this.post && this.user) {
      this.showPayMask =
        (this.post.postPayFlag && !this.user.isAdmin && this.post.postOwner !== this.user.userId) ||
        (!!this.postMeta['should_login'] && !this.isLoggedIn);
    }
  }

  private parseHtml() {
    this.post.postContent = this.post.postContent.replace(
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
        codeStr = codeStr
          .replace(/&lt;/gi, '<')
          .replace(/&gt;/gi, '>')
          .replace(/&amp;/gi, '&')
          .replace(/&hellip;/gi, '…');
        const lines = codeStr
          .split(/\r\n|\r|\n/i)
          .map((str, i) => `<li>${i + 1}</li>`)
          .join('');
        const codes = language
          ? highlight.highlight(codeStr, { language }).value
          : highlight.highlightAuto(codeStr).value;

        return (
          `<pre class="i-code"${langStr ? ' data-lang="' + langStr + '"' : ''}>` +
          `<div class="i-code-info">` +
          `<span>${langStr}</span><span class="i-code-copy">${this.copyHTML}</span>` +
          `</div>` +
          `<div class="i-code-body">` +
          `<ul class="i-code-lines">${lines}</ul>` +
          `<code class="i-code-html">${codes}</code>` +
          `<div class="i-code-text">${codeStr}</div>` +
          `</div>` +
          `</pre>`
        );
      }
    );
  }

  private checkPostVoted() {
    if (this.platform.isBrowser) {
      const likedPosts = (localStorage.getItem(STORAGE_KEY_VOTED_POSTS) || '').split(',');
      this.postVoted = likedPosts.includes(this.postId);
    }
  }
}
