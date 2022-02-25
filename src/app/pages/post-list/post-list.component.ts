import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { BaseComponent } from '../../core/base.component';
import { CrumbEntity } from '../../interfaces/crumb';
import { OptionEntity } from '../../interfaces/options';
import { PaginatorEntity } from '../../interfaces/paginator';
import { Post, PostList, PostQueryParam } from '../../interfaces/posts';
import { CrumbService } from '../../services/crumb.service';
import { OptionsService } from '../../services/options.service';
import { PaginatorService } from '../../services/paginator.service';
import { PostsService } from '../../services/posts.service';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.less']
})
export class PostListComponent extends BaseComponent implements OnInit {
  pageIndex: string = 'index';
  options: Observable<OptionEntity> = this.optionsService.options$;
  page: number = 1;
  keyword: string = '';
  category: string = '';
  tag: string = '';
  year: string = '';
  month: string = '';
  postList: PostList = {};
  count: number = 0;
  paginatorData: PaginatorEntity | null = null;
  pageUrl: string = '';
  pageUrlParam: string = '';
  showCrumb: boolean = false;

  constructor(
    private optionsService: OptionsService,
    private postsService: PostsService,
    private paginator: PaginatorService,
    private router: ActivatedRoute,
    private crumbService: CrumbService
  ) {
    super();
  }

  ngOnInit(): void {
    this.router.params.subscribe((params) => {
      this.page = parseInt(params['page'], 10) || 1;
      this.category = params['category']?.trim();
      this.tag = params['tag']?.trim();
      this.year = params['year']?.trim();
      this.month = params['month']?.trim();
    });
    this.router.queryParams.subscribe((params) => {
      this.keyword = params['keyword']?.trim();
    });
    const param: PostQueryParam = {
      page: this.page
    };
    let crumbs: CrumbEntity[] | null;
    if (this.keyword) {
      param.keyword = this.keyword;
    }
    if (this.category) {
      param.category = this.category
    }
    if (this.tag) {
      param.tag = this.tag;
      crumbs = [{
        'label': '标签',
        'tooltip': '标签',
        'url': '',
        'headerFlag': false
      }, {
        'label': this.tag,
        'tooltip': this.tag,
        'url': '/tag/' + this.tag,
        'headerFlag': true
      }];
    }
    if (this.year) {
      param.year = this.year;
      crumbs = [{
        'label': '文章归档',
        'tooltip': '文章归档',
        'url': '/archive',
        'headerFlag': false
      }, {
        'label': `${this.year}年`,
        'tooltip': `${this.year}年`,
        'url': '/archive/' + this.year,
        'headerFlag': !this.year
      }];
      if (this.month) {
        param.month = this.month;
        crumbs.push({
          'label': `${parseInt(this.month, 10)}月`,
          'tooltip': `${this.year}年${this.month}月`,
          'url': `/archive/${this.year}/${this.month}`,
          'headerFlag': true
        });
      }
    }
    this.postsService.getPosts(param).subscribe((res) => {
      this.postList = res.postList;
      this.page = this.postList.page || 1;
      this.count = this.postList.count || 0;
      crumbs = res.crumbs || crumbs || null;
      if (crumbs) {
        this.showCrumb = true;
        this.crumbService.updateCrumb(crumbs);
      }

      this.paginatorData = this.paginator.getPaginator(this.page, this.count);
      const urlSegments: string[] = [];
      for (let url of this.router.snapshot.url) {
        urlSegments.push(url.path);
      }
      if (urlSegments.length < 1) {
        urlSegments.push('post');
      }
      if (this.router.snapshot.paramMap.get('page')) {
        urlSegments.splice(-1, 1, 'page-');
      } else {
        urlSegments.push('page-');
      }
      this.pageUrl = `/${urlSegments.join('/')}`;
      const params = this.router.snapshot.queryParams;
      const urlQuery: string[] = [];
      Object.keys(params).forEach((key) => {
        urlQuery.push(`${key}=${params[key]}`);
      });
      this.pageUrlParam = urlQuery.length > 0 ? '?' + urlQuery.join('&') : '';
    });
  }
}
