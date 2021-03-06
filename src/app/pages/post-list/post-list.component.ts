import { ViewportScroller } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, Optional, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { RESPONSE } from '@nguniversal/express-engine/tokens';
import { Response } from 'express';
import { uniq } from 'lodash';
import { combineLatestWith, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BreadcrumbEntity } from '../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../components/breadcrumb/breadcrumb.service';
import { CommonService } from '../../core/common.service';
import { MetaService } from '../../core/meta.service';
import { PageComponent } from '../../core/page.component';
import { PaginatorService } from '../../core/paginator.service';
import { UserAgentService } from '../../core/user-agent.service';
import { HTMLMetaData } from '../../interfaces/meta';
import { OptionEntity } from '../../interfaces/options';
import { PaginatorEntity } from '../../interfaces/paginator';
import { PostList, PostQueryParam } from '../../interfaces/posts';
import { OptionsService } from '../../services/options.service';
import { PostsService } from '../../services/posts.service';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.less']
})
export class PostListComponent extends PageComponent implements OnInit, OnDestroy {
  isMobile = false;
  pageIndex = 'index';
  options: OptionEntity = {};
  page = 1;
  keyword = '';
  category = '';
  tag = '';
  year = '';
  month = '';
  postList: PostList = {};
  total = 0;
  paginatorData: PaginatorEntity | null = null;
  pageUrl = '';
  pageUrlParam: Params = {};
  showCrumb = false;

  private optionsListener!: Subscription;
  private paramListener!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private optionsService: OptionsService,
    private postsService: PostsService,
    private commonService: CommonService,
    private paginator: PaginatorService,
    private crumbService: BreadcrumbService,
    private metaService: MetaService,
    private userAgentService: UserAgentService,
    private scroller: ViewportScroller
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.optionsListener = this.optionsService.options$.subscribe((options) => {
      this.options = options;
    });
    this.paramListener = this.route.paramMap.pipe(
      combineLatestWith(this.route.queryParamMap),
      tap(([params, queryParams]) => {
        this.page = Number(params.get('page')) || 1;
        this.category = params.get('category')?.trim() || '';
        this.tag = params.get('tag')?.trim() || '';
        this.year = params.get('year')?.trim() || '';
        this.month = params.get('month')?.trim() || '';
        this.keyword = queryParams.get('keyword')?.trim() || '';
      })
    ).subscribe(() => {
      this.fetchPosts();
      this.scroller.scrollToPosition([0, 0]);
    });
  }

  ngOnDestroy() {
    this.optionsListener.unsubscribe();
    this.paramListener.unsubscribe();
  }

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.pageIndex);
  }

  private fetchPosts() {
    const param: PostQueryParam = {
      page: this.page
    };
    let breadcrumbs: BreadcrumbEntity[];
    if (this.keyword) {
      param.keyword = this.keyword;
    }
    if (this.category) {
      param.category = this.category;
    }
    if (this.tag) {
      this.pageIndex = 'tag';
      param.tag = this.tag;
      breadcrumbs = [{
        label: '??????',
        tooltip: '??????',
        url: '',
        isHeader: false
      }, {
        label: this.tag,
        tooltip: this.tag,
        url: '/tag/' + this.tag,
        isHeader: true
      }];
    }
    if (this.year) {
      this.pageIndex = 'archive';
      param.year = this.year;
      breadcrumbs = [{
        label: '????????????',
        tooltip: '????????????',
        url: '/archive',
        isHeader: false
      }, {
        label: `${this.year}???`,
        tooltip: `${this.year}???`,
        url: '/archive/' + this.year,
        isHeader: !this.year
      }];
      if (this.month) {
        param.month = this.month;
        breadcrumbs.push({
          label: `${parseInt(this.month, 10)}???`,
          tooltip: `${this.year}???${this.month}???`,
          url: `/archive/${this.year}/${this.month}`,
          isHeader: true
        });
      }
    }
    this.postsService.getPosts(param).subscribe((res) => {
      this.postList = res.postList || {};
      this.page = this.postList.page || 1;
      this.total = this.postList.total || 0;

      const siteName: string = this.options['site_name'] || '';
      let description: string = '';
      const titles: string[] = [siteName];
      const taxonomies: string[] = [];
      const keywords: string[] = (this.options['site_keywords'] || '').split(',');
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
      description += taxonomies.length > 0 ? `???${taxonomies.join('-')}???` : '';
      if (this.year) {
        const label = `${this.year}???${this.month ? this.month + '???' : ''}`;
        titles.unshift(label);
        description += label;
      }
      if (this.keyword) {
        titles.unshift(this.keyword, '??????');
        description += `???${this.keyword}???????????????`;
        keywords.unshift(this.keyword);
      } else {
        description += '????????????';
      }
      if (this.page > 1) {
        titles.unshift(`???${this.page}???`);
        description += `(???${this.page}???)`;
      }
      if (description === '????????????') {
        description = '';
      } else {
        description += '???';
      }
      description += `${this.options['site_description']}`;
      if (titles.length === 1) {
        titles.unshift(this.options['site_slogan']);
      }
      const metaData: HTMLMetaData = {
        title: titles.join(' - '),
        description,
        author: this.options['site_author'],
        keywords: uniq(keywords).join(',')
      };
      this.metaService.updateHTMLMeta(metaData);

      if (res.breadcrumbs && res.breadcrumbs.length > 0) {
        breadcrumbs = res.breadcrumbs;
        this.pageIndex = res.breadcrumbs[0].slug || '';
      }
      if (breadcrumbs) {
        this.showCrumb = true;
        this.crumbService.updateCrumb(breadcrumbs);
      }
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
