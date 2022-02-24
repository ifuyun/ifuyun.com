import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { BaseComponent } from '../../core/base.component';
import { OptionEntity } from '../../interfaces/options';
import { PaginatorEntity } from '../../interfaces/paginator';
import { Post, PostList, PostQueryParam } from '../../interfaces/posts';
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

  constructor(
    private optionsService: OptionsService,
    private postsService: PostsService,
    private paginator: PaginatorService,
    private router: ActivatedRoute
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
    if (this.keyword) {
      param.keyword = this.keyword;
    }
    if (this.category) {
      param.category = this.category
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
    this.postsService.getPosts(param).subscribe((postList) => {
      this.postList = postList;
      this.page = postList.page || 1;
      this.count = postList.count || 0;
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
