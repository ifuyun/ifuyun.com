import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Post, PostArchiveDate } from '../../interfaces/posts';
import { PostsService } from '../../services/posts.service';
import { UrlService } from '../../services/url.service';

@Component({
  selector: 'app-sider',
  templateUrl: './sider.component.html',
  styleUrls: ['./sider.component.less']
})
export class SiderComponent implements OnInit {
  archiveDates: PostArchiveDate[] = [];
  hotPosts: Post[] = [];
  randomPosts: Post[] = [];

  constructor(
    private postsService: PostsService
  ) {
  }

  ngOnInit(): void {
    this.postsService.getPostArchiveDates({ showCount: true }).subscribe((res) => {
      this.archiveDates = res;
    });
    this.postsService.getHotPosts().subscribe((res) => {
      this.hotPosts = res;
    });
    this.postsService.getRandomPosts().subscribe((res) => {
      this.randomPosts = res;
    });
  }
}
