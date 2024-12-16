import { DatePipe, NgFor, NgIf, NgStyle } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { PostPrevNextComponent } from '../../components/post-prev-next/post-prev-next.component';
import { PostRelatedComponent } from '../../components/post-related/post-related.component';
import { REGEXP_ID } from '../../config/common.constant';
import { PostType } from '../../enums/post';
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
import { CommonService } from '../../services/common.service';
import { DestroyService } from '../../services/destroy.service';
import { MetaService } from '../../services/meta.service';
import { OptionService } from '../../services/option.service';
import { PostService } from '../../services/post.service';
import { TenantAppService } from '../../services/tenant-app.service';
import { UserAgentService } from '../../services/user-agent.service';
import { UserService } from '../../services/user.service';

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
    PostRelatedComponent
  ],
  providers: [DestroyService],
  templateUrl: './post.component.html',
  styleUrl: './post.component.less'
})
export class PostComponent implements OnInit {
  @Input() postType: PostType = PostType.POST;

  isMobile = false;
  isSignIn = false;
  isArticle = false;
  post!: PostModel;
  postMeta: Record<string, any> = {};
  postCategories: TaxonomyEntity[] = [];
  postTags: TagEntity[] = [];
  isFavorite = false;
  isVoted = false;

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
  private postName = '';
  private postId = '';
  private postSlug = '';
  private referrer = '';
  private breadcrumbs: BreadcrumbEntity[] = [];
  private isChanged = false;
  private isLoaded = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly destroy$: DestroyService,
    private readonly userAgentService: UserAgentService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly userService: UserService,
    private readonly postService: PostService
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
        this.isChanged = this.postName !== postName;
        this.postName = postName;
        if (!this.isLoaded || this.isChanged) {
          if (REGEXP_ID.test(postName)) {
            this.postId = postName;
            this.getPost();
          } else {
            this.postSlug = postName;
            this.getPage();
          }
          this.isLoaded = true;
        }
      });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user = user;
      this.isSignIn = !!user.userId;
    });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getPost(): void {
    this.postService
      .getPostById(this.postId, this.postType, this.referrer)
      .pipe(takeUntil(this.destroy$))
      .subscribe((post) => {
        this.initData(post);
      });
  }

  private getPage(): void {
    this.postService
      .getPostBySlug(this.postSlug, this.postType, this.referrer)
      .pipe(takeUntil(this.destroy$))
      .subscribe((post) => {
        this.initData(post);
      });
  }

  private initData(post?: Post) {
    if (post) {
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
