import { Component, OnInit } from '@angular/core';
import { LinkEntity } from '../../interfaces/links';
import { PostArchiveDate, PostEntity } from '../../interfaces/posts';
import { LinksService } from '../../services/links.service';
import { PostsService } from '../../services/posts.service';
import { UrlService } from '../../services/url.service';

@Component({
  selector: 'app-sider',
  templateUrl: './sider.component.html',
  styleUrls: ['./sider.component.less']
})
export class SiderComponent implements OnInit {
  archiveDates: PostArchiveDate[] = [];
  hotPosts: PostEntity[] = [];
  randomPosts: PostEntity[] = [];
  friendLinks: LinkEntity[] = [];

  constructor(
    private postsService: PostsService,
    private urlService: UrlService,
    private linksService: LinksService
  ) {
  }

  ngOnInit(): void {
    this.postsService.getPostArchiveDates({
      showCount: true
    }).subscribe((res) => this.archiveDates = res);
    this.postsService.getHotPosts().subscribe((res) => this.hotPosts = res);
    this.postsService.getRandomPosts().subscribe((res) => this.randomPosts = res);
    this.urlService.urlInfo$.subscribe((url) => {
      const isHome = url.current.split('?')[0] === '/';
      this.linksService.getFriendLinks(isHome).subscribe((res) => this.friendLinks = res);
    });
  }
}
