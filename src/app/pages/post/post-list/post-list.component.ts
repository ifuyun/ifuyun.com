import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { combineLatestWith, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { APP_ID } from '../../../config/common.constant';
import { PostType } from '../../../config/common.enum';
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
  @Input() postType: PostType = PostType.POST;

  isMobile = false;
  pageIndex = 'post';
  options: OptionEntity = {};
  page = 1;
  keyword = '';
  category = '';
  tag = '';
  postList: Post[] = [];
  total = 0;
  paginatorData: PaginatorEntity | null = null;
  pageUrl = '';
  pageUrlParam: Params = {};

  private isPost = false;
  private pageSize = 10;
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
    this.isPost = this.postType === PostType.POST;
    this.updatePageOptions();
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        combineLatestWith(this.route.paramMap, this.route.queryParamMap),
        takeUntil(this.destroy$)
      )
      .subscribe(([options, params, queryParams]) => {
        this.options = options;

        this.pageSize = Number(this.options['post_page_size']) || 10;
        this.page = Number(queryParams.get('page')) || 1;
        this.category = params.get('category')?.trim() || '';
        this.tag = params.get('tag')?.trim() || '';
        this.year = params.get('year')?.trim() || '';
        this.month = params.get('month')?.trim() || '';
        this.keyword = queryParams.get('keyword')?.trim() || '';
        if (this.year) {
          this.pageIndex = 'postArchive';
        } else {
          this.pageIndex = 'post';
        }

        this.updateActivePage();
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
      page: this.page,
      pageSize: this.pageSize,
      postType: this.postType,
      appId: APP_ID
    };
    if (this.keyword) {
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
        this.postList = res.postList?.list || [];
        this.page = res.postList?.page || 1;
        this.total = res.postList?.total || 0;

        res.breadcrumbs = (res.breadcrumbs || []).map((item) => {
          item.url = `/${this.postType}/category/${item.slug}`;
          return item;
        });
        this.updatePageInfo(res.breadcrumbs);
        this.updateBreadcrumb(res.breadcrumbs);

        this.paginatorData = this.paginator.getPaginator(this.page, this.total, this.pageSize);
        const urlSegments = this.route.snapshot.url.map((url) => url.path);
        if (this.postType === PostType.POST && urlSegments[0] !== 'post') {
          urlSegments.unshift('post');
        }
        this.pageUrl = `/${urlSegments.join('/')}`;
      });
  }

  private updatePageInfo(postBreadcrumbs: BreadcrumbEntity[]) {
    const siteName: string = this.options['site_name'] || '';
    const pageType = this.isPost ? '文章' : 'Prompt';

    let description = '';
    const titles: string[] = [pageType, siteName];
    const taxonomies: string[] = [];
    const pageKeywords = this.isPost ? this.options['post_keywords'] : this.options['prompt_keywords'];
    const keywords: string[] = (pageKeywords || '').split(',');

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
      description += `「${this.keyword}」${pageType}搜索结果`;
      keywords.unshift(this.keyword);
    } else {
      if (description) {
        description += pageType;
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
    description += this.options['site_description'];

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description,
      keywords: uniq(keywords).join(','),
      author: this.options['site_author']
    });
  }

  private updateBreadcrumb(postBreadcrumbs: BreadcrumbEntity[]) {
    const urlType = 'post';
    const pageType = '文章';
    let breadcrumbs: BreadcrumbEntity[] = [
      {
        label: pageType,
        tooltip: `${pageType}列表`,
        url: `/${urlType}`,
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
          url: `/${urlType}/tag/${this.tag}`,
          isHeader: true
        }
      );
    }
    if (this.year) {
      breadcrumbs.push(
        {
          label: '归档',
          tooltip: `${pageType}归档`,
          url: `/${urlType}/archive`,
          isHeader: false
        },
        {
          label: `${this.year}年`,
          tooltip: `${this.year}年`,
          url: `/${urlType}/archive/${this.year}`,
          isHeader: !this.month
        }
      );
      if (this.month) {
        breadcrumbs.push({
          label: `${parseInt(this.month, 10)}月`,
          tooltip: `${this.year}年${this.month}月`,
          url: `/${urlType}/archive/${this.year}/${this.month}`,
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
