import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LinkEntity } from '../../interfaces/link.interface';
import { PostArchiveDate, PostEntity } from '../../pages/post/post.interface';
import { LinkService } from '../../services/link.service';
import { PostService } from '../../pages/post/post.service';
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
    private postService: PostService,
    private urlService: UrlService,
    private linkService: LinkService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.archiveListener = this.postService
      .getPostArchives({
        showCount: true
      })
      .subscribe((res) => (this.archiveDates = res));
    this.hotPostsListener = this.postService.getHotPosts().subscribe((res) => (this.hotPosts = res));
    this.randomPostsListener = this.postService.getRandomPosts().subscribe((res) => (this.randomPosts = res));
    this.urlListener = this.urlService.urlInfo$.subscribe((url) => {
      const isHome = url.current.split('?')[0] === '/';
      this.linksListener = this.linkService.getFriendLinks(isHome).subscribe((res) => (this.friendLinks = res));
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
