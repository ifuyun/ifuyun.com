import { DatePipe, NgStyle } from '@angular/common';
import { Component, input, OnInit } from '@angular/core';
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
  CommentTargetType,
  ContentType,
  FavoriteType,
  LogActionType,
  LogTargetType,
  VoteType,
  VoteValue
} from 'common/enums';
import { IconCalendarDateComponent, IconLockComponent, IconShareFillComponent } from 'common/icons';
import { PostCategoryVo, PostModel, PostTagVo, PostVo, TenantAppVo } from 'common/interfaces';
import { NumberViewPipe, SafeHtmlPipe } from 'common/pipes';
import {
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
import { MakeMoneyComponent } from '../../make-money/make-money.component';
import { ShareModalComponent } from '../../share-modal/share-modal.component';
import { SmartLinkComponent } from '../../smart-link/smart-link.component';
import { LicenseLinkPipe } from '../license-link.pipe';
import { LicensePipe } from '../license.pipe';
import { PostPrevNextComponent } from '../post-prev-next/post-prev-next.component';
import { PostRelatedComponent } from '../post-related/post-related.component';

@Component({
  selector: 'lib-post',
  imports: [
    NgStyle,
    RouterLink,
    DatePipe,
    NzIconModule,
    SafeHtmlPipe,
    NumberViewPipe,
    LicensePipe,
    LicenseLinkPipe,
    BreadcrumbComponent,
    PostPrevNextComponent,
    PostRelatedComponent,
    CommentComponent,
    ShareModalComponent,
    MakeMoneyComponent,
    SmartLinkComponent,
    IconCalendarDateComponent,
    IconShareFillComponent,
    IconLockComponent
  ],
  providers: [DestroyService, NzImageService],
  templateUrl: './post.component.html',
  styleUrl: './post.component.less'
})
export class PostComponent implements OnInit {
  readonly contentType = input<ContentType>(ContentType.POST);

  readonly commentType = this.contentType() === ContentType.POST ? CommentTargetType.POST : CommentTargetType.PAGE;

  isMobile = false;
  isSignIn = false;
  isArticle = false;
  blogHost = '';
  post!: PostModel;
  postMeta: Record<string, any> = {};
  postCategories: PostCategoryVo[] = [];
  postTags: PostTagVo[] = [];
  isFavorite = false;
  isVoted = false;
  voteLoading = false;
  favoriteLoading = false;
  shareVisible = false;
  shareUrl = '';

  get showPayMask() {
    return (
      (this.post.isPaid && (!this.user || (!this.user.isAdmin && this.post.creatorId !== this.user.id))) ||
      (this.post.visibility === 3 && !this.isSignIn)
    );
  }

  protected pageIndex = 'post-detail';

  private readonly copyHTML = `<span class="fi"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/></svg></span>`;
  private readonly copiedHTML = `<span class="fi"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/></svg></span>`;

  private appInfo!: TenantAppVo;
  private options: OptionEntity = {};
  private user!: UserModel;
  private postId = '';
  private postSlug = '';
  private referrer = '';
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
    private readonly logService: LogService
  ) {
    this.isMobile = this.userAgentService.isMobile;
    this.blogHost = this.appConfigService.apps['blog'].url;
  }

  ngOnInit(): void {
    this.isArticle = this.contentType() === ContentType.POST;

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$, this.route.paramMap])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options, p]) => {
        this.appInfo = appInfo;
        this.options = options;
        this.referrer = this.commonService.getReferrer(true);

        const slug = p.get('slug')?.trim() || '';
        if (!slug) {
          this.commonService.redirectToNotFound();
          return;
        }

        this.closeShareQrcode();

        if (REGEXP_ID.test(slug)) {
          this.postId = slug;
          this.getPost();
          this.commentService.updateTargetId(this.postId);
        } else {
          this.postSlug = slug;
          this.getPage();
        }
      });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user = user;
      this.isSignIn = !!user.id;

      if (this.platform.isBrowser) {
        this.shareUrl = this.commonService.getShareURL(user.id);
      }
    });
  }

  onPostClick(e: MouseEvent) {
    const $target = e.target as HTMLElement;

    if ($target.classList.contains('i-code-copy')) {
      e.preventDefault();
      e.stopPropagation();

      if (!this.isSignIn) {
        this.showSigninModal();
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
            action: LogActionType.COPY_CODE,
            targetType: LogTargetType.POST,
            targetId: this.post.id,
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
    return !this.post.isPaid && (this.post.visibility !== 3 || this.isSignIn);
  }

  vote() {
    if (this.voteLoading || this.isVoted) {
      return;
    }
    if (!this.isSignIn) {
      this.showSigninModal();
      return;
    }
    this.voteService
      .saveVote({
        targetId: this.post.id,
        value: VoteValue.LIKE,
        type: this.contentType() === ContentType.PAGE ? VoteType.PAGE : VoteType.POST
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.voteLoading = false;

        if (res.code === ResponseCode.SUCCESS) {
          this.message.success(Message.VOTE_SUCCESS);
          this.isVoted = true;
          this.post.postStat.likeCount = res.data.likes;
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
      this.showSigninModal();
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

  showSigninModal() {
    this.commonService.updateSigninModalVisible({
      visible: true,
      closable: true
    });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getPost(): void {
    this.postService
      .getPostById(this.postId, this.contentType(), this.referrer)
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
      .getPostBySlug(this.postSlug, this.contentType(), this.referrer)
      .pipe(takeUntil(this.destroy$))
      .subscribe((post) => {
        if (!post) {
          this.commonService.redirectToNotFound();
          return;
        }
        this.initData(post);
        this.commentService.updateTargetId(post.id);
      });
  }

  private initData(post: PostVo) {
    const result = this.postService.parseHTML(post.content, this.copyHTML);

    // 避免覆盖
    this.post = { ...post };
    this.post.content = result.content;
    this.codeList = result.codeList;
    this.post.source = this.postService.getPostSource(post);
    this.postMeta = post.metadata;
    this.postCategories = post.categories;
    this.postTags = post.tags;
    this.isFavorite = post.isFavorite;
    this.isVoted = post.isVoted;

    if (this.isArticle) {
      this.pageIndex = 'post-detail';
    } else {
      this.pageIndex = 'page-' + this.post.slug;
    }

    this.postService.updateActivePostId(post.id);
    this.postService.updateActivePost(post);
    this.updateBreadcrumbs(this.isArticle ? post.breadcrumbs || [] : []);
    this.updatePageIndex();
    this.updatePageInfo();
  }

  private updateBreadcrumbs(breadcrumbData: BreadcrumbEntity[]) {
    const breadcrumbs = breadcrumbData.map((item) => ({
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

    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }

  private updatePageInfo() {
    const titles: string[] = [this.appInfo.name];
    const keywords: string[] = this.postTags
      .map((item) => item.tag.name)
      .concat((this.options['post_keywords'] || '').split(','));

    if (this.isArticle) {
      titles.unshift('博客');
    }
    titles.unshift(this.post.title);

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description: this.post.summary || '',
      keywords: uniq(keywords)
        .filter((item) => !!item)
        .join(','),
      author: this.options['site_author']
    });
  }
}
