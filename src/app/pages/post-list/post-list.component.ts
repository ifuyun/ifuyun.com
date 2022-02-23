import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { BaseComponent } from '../../core/base.component';
import { OptionEntity } from '../../interfaces/options';
import { Post, PostList, PostQueryParam } from '../../interfaces/posts';
import { OptionsService } from '../../services/options.service';
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

  constructor(
    private optionsService: OptionsService,
    private postsService: PostsService,
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
    this.postsService.getPosts(param).subscribe((res) => this.postList = res);
  }
}
