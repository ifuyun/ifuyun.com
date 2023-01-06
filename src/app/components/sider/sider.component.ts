import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs';
import { ArchiveData } from '../../core/common.interface';
import { CommonService } from '../../core/common.service';
import { DestroyService } from '../../core/destroy.service';
import { PlatformService } from '../../core/platform.service';
import { UrlService } from '../../core/url.service';
import { LinkEntity } from '../../interfaces/link.interface';
import { PostEntity } from '../../pages/post/post.interface';
import { PostService } from '../../pages/post/post.service';
import { WallpaperService } from '../../pages/wallpaper/wallpaper.service';
import { LinkService } from '../../services/link.service';

@Component({
  selector: 'app-sider',
  templateUrl: './sider.component.html',
  styleUrls: ['./sider.component.less'],
  providers: [DestroyService]
})
export class SiderComponent implements OnInit, AfterViewInit, OnDestroy {
  isMobile = false;
  activePage = '';
  postArchives: ArchiveData[] = [];
  wallpaperArchives: ArchiveData[] = [];
  hotPosts: PostEntity[] = [];
  randomPosts: PostEntity[] = [];
  friendLinks: LinkEntity[] = [];
  keyword = '';
  jdUnionVisible = false;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private destroy$: DestroyService,
    private platform: PlatformService,
    private router: Router,
    private urlService: UrlService,
    private commonService: CommonService,
    private postService: PostService,
    private linkService: LinkService,
    private wallpaperService: WallpaperService
  ) {}

  ngOnInit(): void {
    this.postService
      .getPostArchives({
        showCount: true
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => (this.postArchives = res));
    this.wallpaperService
      .getWallpaperArchives({ showCount: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => (this.wallpaperArchives = res));
    this.postService
      .getHotPosts()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => (this.hotPosts = res));
    this.postService
      .getRandomPosts()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => (this.randomPosts = res));
    this.urlService.urlInfo$.pipe(takeUntil(this.destroy$)).subscribe((url) => {
      const isHome = url.current.split('?')[0] === '/';
      this.linkService
        .getFriendLinks(isHome)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => (this.friendLinks = res));
    });
    this.commonService.jdUnionFlag$.pipe(takeUntil(this.destroy$)).subscribe((flag) => {
      this.jdUnionVisible = flag;
    });
  }

  ngAfterViewInit() {
    if (this.platform.isBrowser) {
      window.addEventListener('scroll', this.scrollHandler);
      window.addEventListener('resize', this.scrollHandler);
    }
  }

  ngOnDestroy() {
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
