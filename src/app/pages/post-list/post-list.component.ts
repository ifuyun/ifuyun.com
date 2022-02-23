import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { BaseComponent } from '../../core/base.component';
import { OptionEntity } from '../../interfaces/options';
import { Post, PostList } from '../../interfaces/posts';
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
  keyword: string = '';
  page: number = 1;
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
    });
    this.router.queryParams.subscribe((params) => {
      this.keyword = params['keyword']?.trim();
    });
    const param: any = {
      page: this.page
    };
    if (this.keyword) {
      param['keyword'] = this.keyword;
    }
    this.postsService.getPosts(param).subscribe((res) => this.postList = res);
  }
}
