import { NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { BreadcrumbComponent, MakeMoneyComponent, PaginationComponent, PostItemComponent } from 'common/components';
import {
  BreadcrumbEntity,
  BreadcrumbService,
  DestroyService,
  MetaService,
  OptionEntity,
  PaginationService,
  UserAgentService
} from 'common/core';
import { BookEntity, Post, PostList, PostQueryParam, TenantAppModel } from 'common/interfaces';
import { BookService, CommonService, OptionService, PostService, TenantAppService } from 'common/services';
import { isEmpty, uniq } from 'lodash';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'app-post-list',
  imports: [NgFor, NzEmptyModule, BreadcrumbComponent, PaginationComponent, MakeMoneyComponent, PostItemComponent],
  providers: [DestroyService],
  templateUrl: './post-list.component.html',
  styleUrl: './post-list.component.less'
})
export class PostListComponent implements OnInit {
  isMobile = false;
  page = 1;
  pageSize = 10;
  total = 0;
  posts: Post[] = [];

  protected pageIndex = 'post-list';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private lastParam = '';
  private category = '';
  private tag = '';
  private year = '';
  private month = '';
  private bookId = '';
  private postBook?: BookEntity;

  get paginationUrl() {
    if (this.category) {
      return `/category/${this.category}`;
    }
    if (this.tag) {
      return `/tag/${this.tag}`;
    }
    if (this.year) {
      return `/archive/${this.year}${this.month ? '/' + this.month : ''}`;
    }

    return '/list';
  }

  get paginationParam(): Params {
    const param: Params = {};
    if (this.bookId) {
      param['bookId'] = this.bookId;
    }

    return param;
  }

  private get postBookName() {
    return this.bookService.getBookName(this.postBook, false);
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly destroy$: DestroyService,
    private readonly userAgentService: UserAgentService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly paginationService: PaginationService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly postService: PostService,
    private readonly bookService: BookService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngOnInit(): void {
    combineLatest([
      this.tenantAppService.appInfo$,
      this.optionService.options$,
      this.route.paramMap,
      this.route.queryParamMap
    ])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        const { queryParamMap: qp, paramMap: p } = this.route.snapshot;

        this.appInfo = appInfo;
        this.options = options;

        this.pageSize = Number(this.options['post_page_size']) || 10;
        this.page = Number(qp.get('page')) || 1;
        this.bookId = qp.get('bookId')?.trim() || '';

        this.category = p.get('category')?.trim() || '';
        this.tag = p.get('tag')?.trim() || '';
        this.year = p.get('year')?.trim() || '';
        this.month = p.get('month')?.trim() || '';

        const latestParam = JSON.stringify({
          page: this.page,
          bookId: this.bookId,
          category: this.category,
          tag: this.tag,
          year: this.year,
          month: this.month
        });
        if (latestParam === this.lastParam) {
          return;
        }
        this.lastParam = latestParam;

        if (this.year) {
          this.pageIndex = 'post-archive';
        } else {
          this.pageIndex = 'post-list';
        }

        this.updatePageIndex();
        if (this.bookId) {
          this.getPostsByBookId();
        } else {
          this.getPosts();
        }
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getPosts() {
    const param: PostQueryParam = {
      page: this.page,
      pageSize: this.pageSize
    };
    if (this.category) {
      param.category = this.category;
    }
    if (this.tag) {
      param.tag = this.tag;
    }
    if (this.year) {
      param.year = this.year;
      if (this.month) {
        param.month = this.month;
      }
    }

    this.postService
      .getPosts(param)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.posts = res.posts?.list || [];
        this.page = res.posts?.page || 1;
        this.total = res.posts?.total || 0;
        this.postBook = undefined;

        const breadcrumbs = (res.breadcrumbs || []).map((item) => ({
          ...item,
          url: `/category/${item.slug}`,
          domain: 'blog'
        }));
        this.initData(breadcrumbs);
      });
  }

  private getPostsByBookId() {
    this.postService
      .getPostsByBookId<PostList>({
        page: this.page,
        pageSize: this.pageSize,
        bookId: this.bookId,
        simple: 0
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.posts = res.posts?.list || [];
        this.page = res.posts?.page || 1;
        this.total = res.posts?.total || 0;
        this.postBook = res.book;

        this.initData([]);
      });
  }

  private initData(breadcrumbs: BreadcrumbEntity[]) {
    this.paginationService.updatePagination({
      page: this.page,
      total: this.total,
      pageSize: this.pageSize,
      url: this.paginationUrl,
      param: this.paginationParam
    });
    this.updatePageInfo(breadcrumbs);
    this.updateBreadcrumbs(breadcrumbs);
  }

  private updatePageInfo(breadcrumbData: BreadcrumbEntity[]) {
    const titles: string[] = ['博客', this.appInfo.appName];
    const categories: string[] = [];
    const keywords: string[] = (this.options['post_keywords'] || '').split(',');
    let description = '';

    if (this.category && breadcrumbData.length > 0) {
      const label = breadcrumbData[breadcrumbData.length - 1].label;
      titles.unshift(label);
      categories.push(label);
      keywords.unshift(label);
    }
    if (this.tag) {
      titles.unshift(this.tag);
      categories.push(this.tag);
      keywords.unshift(this.tag);
    }
    description += categories.length > 0 ? `「${categories.join('-')}」` : '';
    if (this.year) {
      const label = `${this.year}年${this.month ? this.month + '月' : ''}`;
      titles.unshift(label);
      description += label;
    }
    if (this.postBook) {
      titles.unshift(this.postBook.bookName);
      if (this.postBook.bookIssueNumber) {
        titles.unshift(this.postBook.bookIssueNumber);
      }
      description += this.postBookName.fullName;
      keywords.unshift(this.postBook.bookName);
    }
    if (description) {
      description += '博客文章列表';
    }
    if (this.page > 1) {
      titles.unshift(`第${this.page}页`);
      if (description) {
        description += `(第${this.page}页)`;
      }
    }
    if (description) {
      description += '。';
    }
    description += this.appInfo.appDescription;

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description,
      keywords: uniq(keywords)
        .filter((item) => !!item)
        .join(','),
      author: this.options['site_author']
    });
  }

  private updateBreadcrumbs(breadcrumbData: BreadcrumbEntity[]) {
    let breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '博客',
        tooltip: `博客文章列表`,
        url: '/list',
        domain: 'blog',
        isHeader: false
      }
    ];
    if (this.tag) {
      breadcrumbs.push(
        {
          label: '标签',
          tooltip: '标签',
          url: '',
          isHeader: false
        },
        {
          label: this.tag,
          tooltip: this.tag,
          url: `/tag/${this.tag}`,
          domain: 'blog',
          isHeader: true
        }
      );
    }
    if (this.year) {
      breadcrumbs.push(
        {
          label: '归档',
          tooltip: `博客归档`,
          url: `/archive`,
          domain: 'blog',
          isHeader: false
        },
        {
          label: `${this.year}年`,
          tooltip: `${this.year}年`,
          url: `/archive/${this.year}`,
          domain: 'blog',
          isHeader: !this.month
        }
      );
      if (this.month) {
        breadcrumbs.push({
          label: `${Number(this.month)}月`,
          tooltip: `${this.year}年${this.month}月`,
          url: `/archive/${this.year}/${this.month}`,
          domain: 'blog',
          isHeader: true
        });
      }
    }
    if (breadcrumbData.length > 0) {
      breadcrumbs = breadcrumbs.concat(breadcrumbData);
    }
    if (this.postBook) {
      breadcrumbs.push({
        label: this.postBookName.fullName,
        tooltip: this.postBookName.fullName,
        url: '/list',
        domain: 'blog',
        param: {
          bookId: this.bookId
        },
        isHeader: true
      });
    }
    if (this.page > 1) {
      breadcrumbs.push({
        label: `第${this.page}页`,
        tooltip: `第${this.page}页`,
        url: '',
        isHeader: false
      });
    }

    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
