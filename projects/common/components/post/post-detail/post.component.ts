import { DatePipe, NgFor, NgIf, NgStyle } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  AppConfigService,
  BreadcrumbEntity,
  BreadcrumbService,
  DestroyService,
  Message,
  MessageService,
  MetaService,
  OptionEntity,
  PlatformService,
  REGEXP_ID,
  ResponseCode,
  UserAgentService,
  UserModel
} from 'common/core';
import {
  ActionObjectType,
  ActionType,
  CommentObjectType,
  FavoriteType,
  PostType,
  VoteType,
  VoteValue
} from 'common/enums';
import { BookEntity, Post, PostModel, TagEntity, TaxonomyEntity, TenantAppModel } from 'common/interfaces';
import { NumberViewPipe, SafeHtmlPipe } from 'common/pipes';
import {
  BookService,
  CommentService,
  CommonService,
  FavoriteService,
  LogService,
  OptionService,
  PostService,
  TenantAppService,
  UserService,
  VoteService
} from 'common/services';
import { decodeEntities } from 'common/utils';
import { isEmpty, uniq } from 'lodash';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageService } from 'ng-zorro-antd/image';
import { ClipboardService } from 'ngx-clipboard';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from '../../breadcrumb/breadcrumb.component';
import { CommentComponent } from '../../comment/comment.component';
import { LoginModalComponent } from '../../login-modal/login-modal.component';
import { MakeMoneyComponent } from '../../make-money/make-money.component';
import { ShareModalComponent } from '../../share-modal/share-modal.component';
import { SmartLinkComponent } from '../../smart-link/smart-link.component';
import { CopyLinkPipe } from '../copy-link.pipe';
import { CopyTypePipe } from '../copy-type.pipe';
import { PostPrevNextComponent } from '../post-prev-next/post-prev-next.component';
import { PostRelatedComponent } from '../post-related/post-related.component';

@Component({
  selector: 'lib-post',
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
    CommentComponent,
    ShareModalComponent,
    LoginModalComponent,
    MakeMoneyComponent,
    SmartLinkComponent
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
  blogHost = '';
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
      (this.post.postPayFlag && !this.user.isAdmin && this.post.postOwnerId !== this.user.userId) ||
      (!!this.post.postLoginFlag && !this.isSignIn)
    );
  }

  private get postBookName() {
    return this.bookService.getBookName(this.postBook, false);
  }

  protected pageIndex = 'post-article';

  private readonly copyHTML = '<span class="fi fi-copy"></span>Copy code';
  private readonly copiedHTML = '<span class="fi fi-check-lg"></span>Copied!';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private user!: UserModel;
  private postId = '';
  private postSlug = '';
  private referrer = '';
  private postBook?: BookEntity;
  private codeList: string[] = [];

  constructor(
    private readonly destroy$: DestroyService,
    private readonly route: ActivatedRoute,
    private readonly platform: PlatformService,
    private readonly userAgentService: UserAgentService,
    private readonly message: MessageService,
    private readonly imageService: NzImageService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly appConfigService: AppConfigService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly userService: UserService,
    private readonly postService: PostService,
    private readonly voteService: VoteService,
    private readonly favoriteService: FavoriteService,
    private readonly commentService: CommentService,
    private readonly clipboardService: ClipboardService,
    private readonly logService: LogService,
    private readonly bookService: BookService
  ) {
    this.isMobile = this.userAgentService.isMobile;
    this.blogHost = this.appConfigService.apps['blog'].url;
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

        const slug = p.get('slug')?.trim() || '';
        if (!slug) {
          this.commonService.redirectToNotFound();
          return;
        }
        this.closeLoginModal();
        this.closeShareQrcode();
        if (REGEXP_ID.test(slug)) {
          this.postId = slug;
          this.getPost();
          this.commentService.updateObjectId(this.postId);
        } else {
          this.postSlug = slug;
          this.getPage();
        }
      });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user = user;
      this.isSignIn = !!user.userId;

      if (this.platform.isBrowser) {
        this.shareUrl = this.commonService.getShareURL(user.userId);
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
      const index = Number($target.dataset['i']);
      const codeText = this.codeList[index];
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
            objectId: this.post.postId,
            index: index + 1
          })
          .pipe(takeUntil(this.destroy$))
          .subscribe();
      }
    } else if ($target instanceof HTMLImageElement) {
      e.preventDefault();
      e.stopPropagation();

      this.imageService.preview([
        {
          src: $target.src
        }
      ]);
    }
  }

  onPostSelect() {
    return !this.post.postPayFlag && (!this.post.postLoginFlag || this.isSignIn);
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
        objectId: this.post.postId,
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
    const urlPrefix = this.commonService.getCdnUrlPrefix();
    const previewRef = this.imageService.preview([
      {
        src: urlPrefix + '/assets/images/reward.jpg'
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
    const result = this.postService.parseHTML(post.post.postContent, this.copyHTML);

    this.post = post.post;
    this.post.postContent = result.content;
    this.postBook = post.book;
    this.codeList = result.codeList;
    this.post.postSource = this.postService.getPostSource(post);
    this.postMeta = post.meta;
    this.postCategories = post.categories;
    this.postTags = post.tags;
    this.isFavorite = post.isFavorite;
    this.isVoted = post.isVoted;

    if (this.isArticle) {
      this.pageIndex = 'post-article';
    } else {
      this.pageIndex = 'page-' + this.post.postName;
    }

    this.postService.updateActivePostId(post.post.postId);
    this.postService.updateActiveBook(post.book);
    this.updateBreadcrumbs(this.isArticle ? post.breadcrumbs : []);
    this.updatePageIndex();
    this.updatePageInfo();
  }

  private updateBreadcrumbs(breadcrumbData?: BreadcrumbEntity[]) {
    const breadcrumbs = (breadcrumbData || []).map((item) => ({
      ...item,
      url: `/category/${item.slug}`,
      domain: 'blog'
    }));
    breadcrumbs.unshift({
      label: '博客',
      tooltip: '博客',
      url: '/',
      domain: 'blog',
      isHeader: false
    });
    if (this.postBook) {
      breadcrumbs[breadcrumbs.length - 1].isHeader = false;
      breadcrumbs.push({
        label: this.postBookName.fullName,
        tooltip: this.postBookName.fullName,
        url: '/list',
        domain: 'blog',
        param: {
          bookId: this.postBook.bookId
        },
        isHeader: true
      });
    }

    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }

  private updatePageInfo() {
    const titles: string[] = [this.appInfo.appName];
    const keywords: string[] = this.postTags
      .map((item) => item.tagName)
      .concat((this.options['post_keywords'] || '').split(','));

    if (this.isArticle) {
      titles.unshift('博客');
    }
    if (this.postBook) {
      titles.unshift(this.postBook.bookName);
      if (this.postBook.bookIssueNumber) {
        titles.unshift(this.postBook.bookIssueNumber);
      }
      keywords.unshift(this.postBook.bookName);
    }
    titles.unshift(this.post.postTitle);

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description: this.post.postExcerpt,
      keywords: uniq(keywords)
        .filter((item) => !!item)
        .join(','),
      author: this.options['site_author']
    });
  }
}
