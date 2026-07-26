import { DatePipe, NgStyle } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
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
  private readonly destroy$ = inject(DestroyService);
  private readonly route = inject(ActivatedRoute);
  private readonly platform = inject(PlatformService);
  private readonly uaService = inject(UserAgentService);
  private readonly message = inject(MessageService);
  private readonly imageService = inject(NzImageService);
  private readonly commonService = inject(CommonService);
  private readonly metaService = inject(MetaService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly appConfigService = inject(AppConfigService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);
  private readonly userService = inject(UserService);
  private readonly postService = inject(PostService);
  private readonly voteService = inject(VoteService);
  private readonly favoriteService = inject(FavoriteService);
  private readonly commentService = inject(CommentService);
  private readonly clipboardService = inject(ClipboardService);
  private readonly logService = inject(LogService);

  readonly contentType = input<ContentType>(ContentType.POST);

  readonly commentType = computed(() => {
    return this.contentType() === ContentType.POST ? CommentTargetType.POST : CommentTargetType.PAGE;
  });
  readonly isMobile = this.uaService.isMobile;
  readonly isArticle = this.contentType() === ContentType.POST;
  readonly blogHost = this.appConfigService.apps['blog'].url;
  readonly isSignIn = signal(false);
  readonly post = signal<PostModel | null>(null);
  readonly postMeta = signal<Record<string, any>>({});
  readonly postCategories = signal<PostCategoryVo[]>([]);
  readonly postTags = signal<PostTagVo[]>([]);
  readonly isFavorite = signal(false);
  readonly isVoted = signal(false);
  readonly voteLoading = signal(false);
  readonly favoriteLoading = signal(false);
  readonly shareVisible = signal(false);
  readonly shareUrl = signal('');
  readonly showPayMask = computed(() => {
    const post = this.post();
    const user = this.user();

    if (!post) {
      return false;
    }

    return (
      (post.isPaid && (!user || (!user.isAdmin && post.creatorId !== user.id))) ||
      (post.visibility === 3 && !this.isSignIn())
    );
  });

  protected readonly pageIndex = signal('post-detail');

  private readonly copyHTML = `<span class="fi"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/></svg></span>`;
  private readonly copiedHTML = `<span class="fi"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/></svg></span>`;

  private readonly appInfo = signal<TenantAppVo | null>(null);
  private readonly options = signal<OptionEntity>({});
  private readonly user = signal<UserModel | null>(null);
  private readonly postId = signal('');
  private readonly postSlug = signal('');
  private readonly referrer = signal('');
  private readonly codeList = signal<string[]>([]);

  ngOnInit(): void {
    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$, this.route.paramMap])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options, p]) => {
        this.appInfo.set(appInfo);
        this.options.set(options);
        this.referrer.set(this.commonService.getReferrer(true));

        const slug = p.get('slug')?.trim() || '';
        if (!slug) {
          this.commonService.redirectToNotFound();
          return;
        }

        this.closeShareQrcode();

        if (REGEXP_ID.test(slug)) {
          this.postId.set(slug);
          this.getPost();
          this.commentService.updateTargetId(slug);
        } else {
          this.postSlug.set(slug);
          this.getPage();
        }
      });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user.set(user);
      this.isSignIn.set(!!user.id);

      if (this.platform.isBrowser) {
        this.shareUrl.set(this.commonService.getShareURL(user.id));
      }
    });
  }

  onPostClick(e: MouseEvent) {
    const $target = e.target as HTMLElement;

    if ($target.classList.contains('i-code-copy')) {
      e.preventDefault();
      e.stopPropagation();

      if (!this.isSignIn()) {
        this.showSigninModal();
        return;
      }
      const index = Number($target.dataset['i']);
      const codeText = this.codeList()[index];
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
            targetId: this.post()!.id,
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
    const post = this.post();

    if (!post) {
      return true;
    }

    return !post.isPaid && (post.visibility !== 3 || this.isSignIn());
  }

  vote() {
    if (this.voteLoading() || this.isVoted()) {
      return;
    }
    if (!this.isSignIn()) {
      this.showSigninModal();
      return;
    }
    const post = this.post();
    if (!post) {
      return;
    }
    this.voteService
      .saveVote({
        targetId: post.id,
        value: VoteValue.LIKE,
        type: this.contentType() === ContentType.PAGE ? VoteType.PAGE : VoteType.POST
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.voteLoading.set(false);

        if (res.code === ResponseCode.SUCCESS) {
          this.message.success(Message.VOTE_SUCCESS);
          this.isVoted.set(true);
          this.post.update((data) => {
            return data
              ? {
                  ...data,
                  postStat: {
                    ...data.postStat,
                    likeCount: res.data.likeCount
                  }
                }
              : null;
          });
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
    if (this.favoriteLoading() || this.isFavorite()) {
      return;
    }
    if (!this.isSignIn()) {
      this.showSigninModal();
      return;
    }
    this.favoriteLoading.set(true);
    this.favoriteService
      .addFavorite(this.postId(), FavoriteType.POST)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.favoriteLoading.set(false);

        if (res.code === ResponseCode.SUCCESS || res.code === ResponseCode.FAVORITE_IS_EXIST) {
          this.message.success(Message.ADD_FAVORITE_SUCCESS);
          this.isFavorite.set(true);
        }
      });
  }

  showShareQrcode() {
    this.shareVisible.set(true);
  }

  closeShareQrcode() {
    this.shareVisible.set(false);
  }

  showSigninModal() {
    this.commonService.updateSigninOptions({
      visible: true,
      closable: true
    });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex());
  }

  private getPost(): void {
    this.postService
      .getPostById(this.postId(), this.contentType(), this.referrer())
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
      .getPostBySlug(this.postSlug(), this.contentType(), this.referrer())
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

    this.post.set({
      ...post,
      content: result.content,
      source: this.postService.getPostSource(post)
    });
    this.codeList.set(result.codeList);
    this.postMeta.set(post.metadata);
    this.postCategories.set(post.categories);
    this.postTags.set(post.tags);
    this.isFavorite.set(post.isFavorite);
    this.isVoted.set(post.isVoted);
    this.pageIndex.set(this.isArticle ? 'post-detail' : 'page-' + post.slug);

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
    const titles: string[] = [this.appInfo()?.name || ''];
    const keywords: string[] = this.postTags()
      .map((item) => item.tag.name)
      .concat((this.options()['post_keywords'] || '').split(','));

    if (this.isArticle) {
      titles.unshift('博客');
    }
    titles.unshift(this.post()?.title || '');

    this.metaService.updateHTMLMeta({
      title: titles.filter((item) => !!item).join(' - '),
      description: this.post()?.summary || '',
      keywords: uniq(keywords)
        .filter((item) => !!item)
        .join(','),
      author: this.options()['site_author']
    });
  }
}
