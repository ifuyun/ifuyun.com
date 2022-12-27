import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PlatformService } from '../../core/platform.service';
import { UrlService } from '../../core/url.service';
import { LinkEntity } from '../../interfaces/link.interface';
import { PostArchiveDate, PostEntity } from '../../pages/post/post.interface';
import { PostService } from '../../pages/post/post.service';
import { LinkService } from '../../services/link.service';

@Component({
  selector: 'app-sider',
  templateUrl: './sider.component.html',
  styleUrls: ['./sider.component.less']
})
export class SiderComponent implements OnInit, OnDestroy {
  isMobile = false;
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
    @Inject(DOCUMENT) private document: Document,
    private platform: PlatformService,
    private postService: PostService,
    private urlService: UrlService,
    private linkService: LinkService,
    private router: Router
  ) {
  }

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

  ngAfterViewInit() {
    if (this.platform.isBrowser) {
      window.addEventListener('scroll', this.scrollHandler);
      window.addEventListener('resize', this.scrollHandler);
    }
  }

  ngOnDestroy() {
    this.archiveListener.unsubscribe();
    this.hotPostsListener.unsubscribe();
    this.randomPostsListener.unsubscribe();
    this.urlListener.unsubscribe();
    this.linksListener.unsubscribe();

    if (this.platform.isBrowser) {
      window.removeEventListener('scroll', this.scrollHandler);
      window.removeEventListener('resize', this.scrollHandler);
    }
  }

  search() {
    this.keyword = this.keyword.trim();
    if (this.keyword) {
      this.router.navigate(['/'], { queryParams: { keyword: this.keyword } });
    }
  }

  private scrollHandler() {
    const documentEle = this.document.documentElement;
    const siderEle = this.document.getElementById('sider') as HTMLElement;
    if (siderEle) {
      if (documentEle.scrollTop > 0 && documentEle.scrollTop > siderEle.scrollHeight - documentEle.clientHeight) {
        siderEle.style.position = 'sticky';
        siderEle.style.top = documentEle.clientHeight - siderEle.scrollHeight - 16 + 'px';
      } else {
        siderEle.style.position = 'relative';
        siderEle.style.top = '';
      }
    }
  }
}
