import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LinkEntity } from '../../interfaces/links';
import { PostArchiveDate, PostEntity } from '../../interfaces/posts';
import { LinksService } from '../../services/links.service';
import { PostsService } from '../../services/posts.service';
import { UrlService } from '../../core/url.service';

@Component({
  selector: 'app-sider',
  templateUrl: './sider.component.html',
  styleUrls: ['./sider.component.less']
})
export class SiderComponent implements OnInit, OnDestroy {
  archiveDates: PostArchiveDate[] = [];
  hotPosts: PostEntity[] = [];
  randomPosts: PostEntity[] = [];
  friendLinks: LinkEntity[] = [];
  keyword = '';

  private archiveListener!: Subscription;
  private hotPostsListener!: Subscription;
  private randomPostsListener!: Subscription;
  private urlListener!: Subscription;
  private linksListener!: Subscription;

  constructor(
    private postsService: PostsService,
    private urlService: UrlService,
    private linksService: LinksService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.archiveListener = this.postsService.getPostArchives({
      showCount: true
    }).subscribe((res) => this.archiveDates = res);
    this.hotPostsListener = this.postsService.getHotPosts().subscribe((res) => this.hotPosts = res);
    this.randomPostsListener = this.postsService.getRandomPosts().subscribe((res) => this.randomPosts = res);
    this.urlListener = this.urlService.urlInfo$.subscribe((url) => {
      const isHome = url.current.split('?')[0] === '/';
      this.linksListener = this.linksService.getFriendLinks(isHome).subscribe((res) => this.friendLinks = res);
    });
  }

  ngOnDestroy() {
    this.archiveListener.unsubscribe();
    this.hotPostsListener.unsubscribe();
    this.randomPostsListener.unsubscribe();
    this.urlListener.unsubscribe();
    this.linksListener.unsubscribe();
  }

  search() {
    this.keyword = this.keyword.trim();
    if (this.keyword) {
      this.router.navigate(['/'], { queryParams: { keyword: this.keyword } });
    }
  }
}
