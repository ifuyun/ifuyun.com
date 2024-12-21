import { DatePipe, NgFor, NgIf, NgStyle } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageService } from 'ng-zorro-antd/image';
import { ClipboardService } from 'ngx-clipboard';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { CommentComponent } from '../../components/comment/comment.component';
import { LoginModalComponent } from '../../components/login-modal/login-modal.component';
import { MakeMoneyComponent } from '../../components/make-money/make-money.component';
import { PostPrevNextComponent } from '../../components/post-prev-next/post-prev-next.component';
import { PostRelatedComponent } from '../../components/post-related/post-related.component';
import { ShareModalComponent } from '../../components/share-modal/share-modal.component';
import { COOKIE_KEY_USER_ID, REGEXP_ID } from '../../config/common.constant';
import { Message } from '../../config/message.enum';
import { ResponseCode } from '../../config/response-code.enum';
import { CommentObjectType } from '../../enums/comment';
import { FavoriteType } from '../../enums/favorite';
import { ActionObjectType, ActionType } from '../../enums/log';
import { PostType } from '../../enums/post';
import { VoteType, VoteValue } from '../../enums/vote';
import { BreadcrumbEntity } from '../../interfaces/breadcrumb';
import { OptionEntity } from '../../interfaces/option';
import { Post, PostModel } from '../../interfaces/post';
import { TagEntity, TaxonomyEntity } from '../../interfaces/taxonomy';
import { TenantAppModel } from '../../interfaces/tenant-app';
import { UserModel } from '../../interfaces/user';
import { CopyLinkPipe } from '../../pipes/copy-link.pipe';
import { CopyTypePipe } from '../../pipes/copy-type.pipe';
import { NumberViewPipe } from '../../pipes/number-view.pipe';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { CommentService } from '../../services/comment.service';
import { CommonService } from '../../services/common.service';
import { DestroyService } from '../../services/destroy.service';
import { FavoriteService } from '../../services/favorite.service';
import { LogService } from '../../services/log.service';
import { MessageService } from '../../services/message.service';
import { MetaService } from '../../services/meta.service';
import { OptionService } from '../../services/option.service';
import { PlatformService } from '../../services/platform.service';
import { PostService } from '../../services/post.service';
import { SsrCookieService } from '../../services/ssr-cookie.service';
import { TenantAppService } from '../../services/tenant-app.service';
import { UserAgentService } from '../../services/user-agent.service';
import { UserService } from '../../services/user.service';
import { VoteService } from '../../services/vote.service';
import { decodeEntities } from '../../utils/entities';

@Component({
  selector: 'app-post',
  imports: [
    NgIf,
    NgFor,
    NgStyle,
    RouterLink,
    DatePipe,
    NzIconModule,
    SafeHtmlPipe,
    NumberViewPipe,
    CopyTypePipe,
    CopyLinkPipe,
    BreadcrumbComponent,
    PostPrevNextComponent,
    PostRelatedComponent,
    ShareModalComponent,
    LoginModalComponent,
    CommentComponent,
    MakeMoneyComponent
  ],
  providers: [DestroyService, NzImageService],
  templateUrl: './post.component.html',
  styleUrl: './post.component.less'
})
export class PostComponent implements OnInit {
  @Input() postType: PostType = PostType.POST;

  readonly commentType = CommentObjectType.POST;

  isMobile = false;
  isSignIn = false;
  isArticle = false;
  post!: PostModel;
  postMeta: Record<string, any> = {};
  postCategories: TaxonomyEntity[] = [];
  postTags: TagEntity[] = [];
  isFavorite = false;
  isVoted = false;
  voteLoading = false;
  favoriteLoading = false;
  shareVisible = false;
  shareUrl = '';
  loginVisible = false;

  get showPayMask() {
    return (
      (this.post.postPayFlag && !this.user.isAdmin && this.post.postOwner !== this.user.userId) ||
      (!!this.post.postLoginFlag && !this.isSignIn)
    );
  }

  protected pageIndex = 'post';

  private readonly copyHTML = '<span class="fi fi-copy"></span>Copy code';
  private readonly copiedHTML = '<span class="fi fi-check-lg"></span>Copied!';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private user!: UserModel;
  private postId = '';
  private postSlug = '';
  private referrer = '';
  private breadcrumbs: BreadcrumbEntity[] = [];

  constructor(
    private readonly destroy$: DestroyService,
    private readonly route: ActivatedRoute,
    private readonly platform: PlatformService,
    private readonly userAgentService: UserAgentService,
    private readonly message: MessageService,
    private readonly imageService: NzImageService,
    private readonly cookieService: SsrCookieService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly userService: UserService,
    private readonly postService: PostService,
    private readonly voteService: VoteService,
    private readonly favoriteService: FavoriteService,
    private readonly commentService: CommentService,
    private readonly clipboardService: ClipboardService,
    private readonly logService: LogService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngOnInit(): void {
    this.isArticle = this.postType === PostType.POST;

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$, this.route.paramMap])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options, p]) => {
        this.appInfo = appInfo;
        this.options = options;
        this.referrer = this.commonService.getReferrer();

        const postName = p.get('postName')?.trim() || '';
        if (!postName) {
          this.commonService.redirectToNotFound();
          return;
        }
        if (REGEXP_ID.test(postName)) {
          this.postId = postName;
          this.getPost();
          this.commentService.updateObjectId(this.postId);
        } else {
          this.postSlug = postName;
          this.getPage();
        }
      });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user = user;
      this.isSignIn = !!user.userId;

      if (this.platform.isBrowser) {
        const userId = user.userId || this.cookieService.get(COOKIE_KEY_USER_ID);
        const shareUrl = location.href.split('#')[0];
        const param = (shareUrl.includes('?') ? '&' : '?') + 'ref=qrcode' + (userId ? '&uid=' + userId : '');
        this.shareUrl = shareUrl + param;
      }
    });
  }

  onPostClick(e: MouseEvent) {
    const $target = e.target as HTMLElement;
    if ($target.classList.contains('i-code-copy')) {
      e.preventDefault();
      e.stopPropagation();

      if (!this.isSignIn) {
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

          window.setTimeout(() => {
            $target.innerHTML = this.copyHTML;
          }, 2000);

          this.logService
            .logAction({
              action: ActionType.COPY_CODE,
              objectType: ActionObjectType.POST,
              objectId: this.post.postId
            })
            .pipe(takeUntil(this.destroy$))
            .subscribe();
        }
      }
    }
  }

  vote() {
    if (this.voteLoading || this.isVoted) {
      return;
    }
    if (!this.isSignIn) {
      this.showLoginModal();
      return;
    }
    this.voteService
      .saveVote({
        objectId: this.postId,
        value: VoteValue.LIKE,
        type: this.postType === PostType.PAGE ? VoteType.PAGE : VoteType.POST
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.voteLoading = false;

        if (res.code === ResponseCode.SUCCESS) {
          this.message.success(Message.VOTE_SUCCESS);
          this.isVoted = true;
          this.post.postLikes = res.data.likes;
        }
      });
  }

  showReward() {
    const previewRef = this.imageService.preview([
      {
        src: '/assets/images/reward.jpg'
      }
    ]);
    this.commonService.paddingPreview(previewRef.previewInstance.imagePreviewWrapper);
  }

  addFavorite() {
    if (this.favoriteLoading || this.isFavorite) {
      return;
    }
    if (!this.isSignIn) {
      this.showLoginModal();
      return;
    }
    this.favoriteLoading = true;
    this.favoriteService
      .addFavorite(this.postId, FavoriteType.POST)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.favoriteLoading = false;

        if (res.code === ResponseCode.SUCCESS || res.code === ResponseCode.FAVORITE_IS_EXIST) {
          this.message.success(Message.ADD_FAVORITE_SUCCESS);
          this.isFavorite = true;
        }
      });
  }

  showShareQrcode() {
    this.shareVisible = true;
  }

  closeShareQrcode() {
    this.shareVisible = false;
  }

  showLoginModal() {
    this.loginVisible = true;
  }

  closeLoginModal() {
    this.loginVisible = false;
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getPost(): void {
    this.postService
      .getPostById(this.postId, this.postType, this.referrer)
      .pipe(takeUntil(this.destroy$))
      .subscribe((post) => {
        if (!post) {
          this.commonService.redirectToNotFound();
          return;
        }
        this.initData(post);
      });
  }

  private getPage(): void {
    this.postService
      .getPostBySlug(this.postSlug, this.postType, this.referrer)
      .pipe(takeUntil(this.destroy$))
      .subscribe((post) => {
        if (!post) {
          this.commonService.redirectToNotFound();
          return;
        }
        this.initData(post);
        this.commentService.updateObjectId(post.post.postId);
      });
  }

  private initData(post: Post) {
    this.post = post.post;
    this.post.postContent = this.postService.parseHTML(this.post.postContent, this.copyHTML);
    this.post.postSource = this.postService.getPostSource(post);
    this.postMeta = post.meta;
    this.postCategories = post.categories;
    this.postTags = post.tags;
    this.isFavorite = post.isFavorite;
    this.isVoted = post.isVoted;

    if (this.isArticle) {
      this.pageIndex = 'post';
      this.breadcrumbs = (post.breadcrumbs || []).map((item) => ({
        ...item,
        url: `/post/category/${item.slug}`
      }));
      this.breadcrumbs.unshift({
        label: '文章',
        tooltip: '文章列表',
        url: '/post',
        isHeader: false
      });
    } else {
      this.pageIndex = this.post.postName;
      this.breadcrumbs = [];
    }

    this.postService.updateActivePostId(post.post.postId);
    this.breadcrumbService.updateBreadcrumbs(this.breadcrumbs);
    this.updatePageIndex();
    this.updatePageInfo();
  }

  private updatePageInfo() {
    const keywords: string[] = this.postTags
      .map((item) => item.tagName)
      .concat((this.options['post_keywords'] || '').split(','));

    this.metaService.updateHTMLMeta({
      title: `${this.post.postTitle} - ${this.appInfo.appName}`,
      description: this.post.postExcerpt,
      keywords: uniq(keywords).join(','),
      author: this.options['site_author']
    });
  }
}
