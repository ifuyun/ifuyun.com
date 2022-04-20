import { ViewportScroller } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, Optional, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { RESPONSE } from '@nguniversal/express-engine/tokens';
import { Response } from 'express';
import { uniq } from 'lodash';
import { combineLatestWith, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { POST_EXCERPT_LENGTH } from '../../config/constants';
import { PageComponent } from '../../core/page.component';
import { CrumbEntity } from '../../components/crumb/crumb.interface';
import { cutStr, filterHtmlTag } from '../../helpers/helper';
import { HTMLMetaData } from '../../interfaces/meta';
import { OptionEntity } from '../../interfaces/options';
import { PaginatorEntity } from '../../interfaces/paginator';
import { PostList, PostQueryParam } from '../../interfaces/posts';
import { CrumbService } from '../../components/crumb/crumb.service';
import { CustomMetaService } from '../../services/custom-meta.service';
import { OptionsService } from '../../services/options.service';
import { CommonService } from '../../core/common.service';
import { PaginatorService } from '../../services/paginator.service';
import { PostsService } from '../../services/posts.service';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.less']
})
export class PostListComponent extends PageComponent implements OnInit, OnDestroy {
  pageIndex: string = 'index';
  options: OptionEntity = {};
  page: number = 1;
  keyword: string = '';
  category: string = '';
  tag: string = '';
  year: string = '';
  month: string = '';
  postList: PostList = {};
  total: number = 0;
  paginatorData: PaginatorEntity | null = null;
  pageUrl: string = '';
  pageUrlParam: Params = {};
  showCrumb: boolean = false;

  private optionsListener!: Subscription;
  private paramListener!: Subscription;

  constructor(
    @Inject(PLATFORM_ID) protected platform: Object,
    @Optional() @Inject(RESPONSE) protected response: Response,
    private route: ActivatedRoute,
    private optionsService: OptionsService,
    private postsService: PostsService,
    private commonService: CommonService,
    private paginator: PaginatorService,
    private crumbService: CrumbService,
    private metaService: CustomMetaService,
    private scroller: ViewportScroller
  ) {
    super();
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
      this.scroller.scrollToAnchor('postList');
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
    let crumbs: CrumbEntity[];
    if (this.keyword) {
      param.keyword = this.keyword;
    }
    if (this.category) {
      param.category = this.category;
    }
    if (this.tag) {
      this.pageIndex = 'tag';
      param.tag = this.tag;
      crumbs = [{
        label: '标签',
        tooltip: '标签',
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
      crumbs = [{
        label: '文章归档',
        tooltip: '文章归档',
        url: '/archive',
        isHeader: false
      }, {
        label: `${this.year}年`,
        tooltip: `${this.year}年`,
        url: '/archive/' + this.year,
        isHeader: !this.year
      }];
      if (this.month) {
        param.month = this.month;
        crumbs.push({
          label: `${parseInt(this.month, 10)}月`,
          tooltip: `${this.year}年${this.month}月`,
          url: `/archive/${this.year}/${this.month}`,
          isHeader: true
        });
      }
    }
    this.postsService.getPosts(param).subscribe((res) => {
      this.postList = res.postList || {};
      this.page = this.postList.page || 1;
      this.total = this.postList.total || 0;
      this.postList.posts?.map((item) => {
        item.post.postExcerpt = item.post.postExcerpt || cutStr(filterHtmlTag(item.post.postContent), POST_EXCERPT_LENGTH);
      });

      const siteName: string = this.options['site_name'] || '';
      let description: string = siteName;
      const titles: string[] = [siteName];
      const taxonomies: string[] = [];
      const keywords: string[] = (this.options['site_keywords'] || '').split(',');
      if (this.category && res.crumbs && res.crumbs.length > 0) {
        titles.unshift(res.crumbs[res.crumbs.length - 1].label);
        taxonomies.push(res.crumbs[res.crumbs.length - 1].label);
        keywords.unshift(res.crumbs[res.crumbs.length - 1].label);
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
      description += '文章';
      if (this.keyword) {
        titles.unshift(`"${this.keyword}"搜索结果`);
        description += `搜索「${this.keyword}」结果`;
        keywords.unshift(this.keyword);
      } else {
        description += '列表';
      }
      if (this.page > 1) {
        titles.unshift(`第${this.page}页`);
        description += `(第${this.page}页)`;
      }
      description += `。${this.options['site_description']}`;
      const metaData: HTMLMetaData = {
        title: titles.join(' - '),
        description,
        author: this.options['site_author'],
        keywords: uniq(keywords).join(',')
      };
      this.metaService.updateHTMLMeta(metaData);

      if (res.crumbs && res.crumbs.length > 0) {
        crumbs = res.crumbs;
        this.pageIndex = res.crumbs[0].slug || '';
      }
      if (crumbs) {
        this.showCrumb = true;
        this.crumbService.updateCrumb(crumbs);
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
