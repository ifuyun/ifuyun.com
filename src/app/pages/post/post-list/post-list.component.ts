import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { combineLatestWith, skipWhile, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { ResultList } from '../../../core/common.interface';
import { CommonService } from '../../../core/common.service';
import { HTMLMetaData } from '../../../core/meta.interface';
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
  styleUrls: []
})
export class PostListComponent extends PageComponent implements OnInit, OnDestroy {
  isMobile = false;
  pageIndex = 'post';
  options: OptionEntity = {};
  page = 1;
  keyword = '';
  category = '';
  tag = '';
  year = '';
  month = '';
  postList: ResultList<Post> = {};
  total = 0;
  paginatorData: PaginatorEntity | null = null;
  pageUrl = '';
  pageUrlParam: Params = {};
  showCrumb = false;

  private optionsListener!: Subscription;
  private postsListener!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private optionService: OptionService,
    private commonService: CommonService,
    private metaService: MetaService,
    private breadcrumbService: BreadcrumbService,
    private postService: PostService,
    private paginator: PaginatorService,
    private userAgentService: UserAgentService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updatePageOptions();
    this.optionsListener = this.optionService.options$
      .pipe(
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

  ngOnDestroy() {
    this.optionsListener.unsubscribe();
    this.postsListener.unsubscribe();
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
    let breadcrumbs: BreadcrumbEntity[] = [
      {
        label: `文章`,
        tooltip: `文章列表`,
        url: '/post',
        isHeader: false
      }
    ];
    if (this.keyword) {
      this.pageIndex = 'search';
      param.keyword = this.keyword;
    }
    if (this.category) {
      param.category = this.category;
    }
    if (this.tag) {
      this.pageIndex = 'tag';
      param.tag = this.tag;
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
      this.pageIndex = 'archive';
      param.year = this.year;
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
        param.month = this.month;
        breadcrumbs.push({
          label: `${parseInt(this.month, 10)}月`,
          tooltip: `${this.year}年${this.month}月`,
          url: `/post/archive/${this.year}/${this.month}`,
          isHeader: true
        });
      }
    }
    this.postsListener = this.postService.getPosts(param).subscribe((res) => {
      this.postList = res.postList || {};
      this.page = this.postList.page || 1;
      this.total = this.postList.total || 0;

      const siteName: string = this.options['site_name'] || '';
      let description = '';
      const titles: string[] = ['文章', siteName];
      const taxonomies: string[] = [];
      const keywords: string[] = (this.options['site_keywords'] || '').split(',');

      if (res.breadcrumbs && res.breadcrumbs.length > 0) {
        breadcrumbs = breadcrumbs.concat(res.breadcrumbs);
        this.pageIndex = res.breadcrumbs[0].slug || '';
      }
      if (this.category && res.breadcrumbs && res.breadcrumbs.length > 0) {
        titles.unshift(res.breadcrumbs[res.breadcrumbs.length - 1].label);
        taxonomies.push(res.breadcrumbs[res.breadcrumbs.length - 1].label);
        keywords.unshift(res.breadcrumbs[res.breadcrumbs.length - 1].label);
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
        description += `「${this.keyword}」搜索结果`;
        keywords.unshift(this.keyword);
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
      } else {
        description += '文章列表';
      }
      if (this.page > 1) {
        titles.unshift(`第${this.page}页`);
        description += `(第${this.page}页)`;
        if (breadcrumbs.length > 0) {
          breadcrumbs.push({
            label: `第${this.page}页`,
            tooltip: `第${this.page}页`,
            url: '',
            isHeader: false
          });
        }
      }
      if (description === '文章列表') {
        description = '';
      } else {
        description += '。';
      }
      description += `${this.options['site_description']}`;
      const metaData: HTMLMetaData = {
        title: titles.join(' - '),
        description,
        keywords: uniq(keywords).join(','),
        author: this.options['site_author']
      };
      this.metaService.updateHTMLMeta(metaData);

      this.showCrumb = true;
      this.breadcrumbService.updateCrumb(breadcrumbs);
      this.updateActivePage();

      this.paginatorData = this.paginator.getPaginator(this.page, this.total);
      const urlSegments = this.route.snapshot.url.map((url) => url.path);
      if (urlSegments.length < 1) {
        urlSegments.push('post');
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
}
