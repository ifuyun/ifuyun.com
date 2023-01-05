import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { combineLatestWith, skipWhile, takeUntil, tap } from 'rxjs';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { ResultList } from '../../../core/common.interface';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { PaginatorEntity } from '../../../core/paginator.interface';
import { PaginatorService } from '../../../core/paginator.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { OptionEntity } from '../../../interfaces/option.interface';
import { OptionService } from '../../../services/option.service';
import { Post, PostQueryParam } from '../post.interface';
import { PostService } from '../post.service';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: [],
  providers: [DestroyService]
})
export class PostListComponent extends PageComponent implements OnInit {
  isMobile = false;
  pageIndex = 'post';
  options: OptionEntity = {};
  page = 1;
  keyword = '';
  category = '';
  tag = '';
  postList: ResultList<Post> = {};
  total = 0;
  paginatorData: PaginatorEntity | null = null;
  pageUrl = '';
  pageUrlParam: Params = {};

  private year = '';
  private month = '';

  constructor(
    private route: ActivatedRoute,
    private userAgentService: UserAgentService,
    private destroy$: DestroyService,
    private metaService: MetaService,
    private commonService: CommonService,
    private breadcrumbService: BreadcrumbService,
    private optionService: OptionService,
    private postService: PostService,
    private paginator: PaginatorService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updatePageOptions();
    this.optionService.options$
      .pipe(
        takeUntil(this.destroy$),
        skipWhile((options) => isEmpty(options)),
        combineLatestWith(this.route.paramMap, this.route.queryParamMap),
        tap(([, params, queryParams]) => {
          this.page = Number(params.get('page')) || 1;
          this.category = params.get('category')?.trim() || '';
          this.tag = params.get('tag')?.trim() || '';
          this.year = params.get('year')?.trim() || '';
          this.month = params.get('month')?.trim() || '';
          this.keyword = queryParams.get('keyword')?.trim() || '';
        })
      )
      .subscribe(([options]) => {
        this.options = options;
        this.fetchPosts();
      });
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

  private fetchPosts() {
    const param: PostQueryParam = {
      page: this.page
    };
    if (this.keyword) {
      this.pageIndex = 'search';
      param.keyword = this.keyword;
    }
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
        this.postList = res.postList || {};
        this.page = this.postList.page || 1;
        this.total = this.postList.total || 0;

        res.breadcrumbs = res.breadcrumbs || [];
        this.updatePageInfo(res.breadcrumbs);
        this.updateBreadcrumb(res.breadcrumbs);

        this.paginatorData = this.paginator.getPaginator(this.page, this.total);
        const urlSegments = this.route.snapshot.url.map((url) => url.path);
        if (urlSegments.length < 1 || urlSegments[0] === 'archive') {
          urlSegments.unshift('post');
        }
        if (this.route.snapshot.paramMap.get('page')) {
          urlSegments.splice(-1, 1, 'page-');
        } else {
          urlSegments.push('page-');
        }
        this.pageUrl = `/${urlSegments.join('/')}`;
        this.pageUrlParam = { ...this.route.snapshot.queryParams };
      });
  }

  private updatePageInfo(postBreadcrumbs: BreadcrumbEntity[]) {
    if (postBreadcrumbs && postBreadcrumbs.length > 0) {
      this.pageIndex = postBreadcrumbs[0].slug || this.pageIndex;
    }
    this.updateActivePage();

    const siteName: string = this.options['site_name'] || '';
    let description = '';
    const titles: string[] = ['文章', siteName];
    const taxonomies: string[] = [];
    const keywords: string[] = (this.options['site_keywords'] || '').split(',');

    if (this.category && postBreadcrumbs.length > 0) {
      const label = postBreadcrumbs[postBreadcrumbs.length - 1].label;
      titles.unshift(label);
      taxonomies.push(label);
      keywords.unshift(label);
    }
    if (this.tag) {
      titles.unshift(this.tag);
      taxonomies.push(this.tag);
      keywords.unshift(this.tag);
    }
    description += taxonomies.length > 0 ? `「${taxonomies.join('-')}」` : '';
    if (this.year) {
      const label = `${this.year}年${this.month ? this.month + '月' : ''}`;
      titles.unshift(label);
      description += label;
    }
    if (this.keyword) {
      titles.unshift(this.keyword, '搜索');
      description += `「${this.keyword}」文章搜索结果`;
      keywords.unshift(this.keyword);
    } else {
      if (description) {
        description += '文章';
      }
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
    description += `${this.options['site_description']}`;

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description,
      keywords: uniq(keywords).join(','),
      author: this.options['site_author']
    });
  }

  private updateBreadcrumb(postBreadcrumbs: BreadcrumbEntity[]) {
    let breadcrumbs: BreadcrumbEntity[] = [
      {
        label: `文章`,
        tooltip: `文章列表`,
        url: '/post',
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
          url: '/tag/' + this.tag,
          isHeader: true
        }
      );
    }
    if (this.year) {
      breadcrumbs.push(
        {
          label: '归档',
          tooltip: '文章归档',
          url: '/post/archive',
          isHeader: false
        },
        {
          label: `${this.year}年`,
          tooltip: `${this.year}年`,
          url: '/post/archive/' + this.year,
          isHeader: !this.month
        }
      );
      if (this.month) {
        breadcrumbs.push({
          label: `${parseInt(this.month, 10)}月`,
          tooltip: `${this.year}年${this.month}月`,
          url: `/post/archive/${this.year}/${this.month}`,
          isHeader: true
        });
      }
    }
    if (postBreadcrumbs.length > 0) {
      breadcrumbs = breadcrumbs.concat(postBreadcrumbs);
    }
    if (this.keyword) {
      breadcrumbs.push(
        {
          label: `搜索`,
          tooltip: `搜索`,
          url: '',
          isHeader: false
        },
        {
          label: this.keyword,
          tooltip: this.keyword,
          url: '',
          isHeader: false
        }
      );
    }
    if (this.page > 1) {
      if (breadcrumbs.length > 0) {
        breadcrumbs.push({
          label: `第${this.page}页`,
          tooltip: `第${this.page}页`,
          url: '',
          isHeader: false
        });
      }
    }
    this.breadcrumbService.updateBreadcrumb(breadcrumbs);
  }
}
