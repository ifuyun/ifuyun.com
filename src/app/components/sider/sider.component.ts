import { NgFor, NgIf } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { skipWhile, takeUntil } from 'rxjs';
import { WallpaperLang } from '../../enums/wallpaper';
import { ArchiveData, PageIndexInfo } from '../../interfaces/common';
import { PostEntity } from '../../interfaces/post';
import { HotWallpaper, Wallpaper } from '../../interfaces/wallpaper';
import { CommonService } from '../../services/common.service';
import { DestroyService } from '../../services/destroy.service';
import { PlatformService } from '../../services/platform.service';
import { PostService } from '../../services/post.service';
import { UserAgentService } from '../../services/user-agent.service';
import { WallpaperService } from '../../services/wallpaper.service';

@Component({
  selector: 'app-sider',
  imports: [RouterLink, NgIf, NgFor, NzIconModule],
  providers: [DestroyService],
  templateUrl: './sider.component.html',
  styleUrl: './sider.component.less'
})
export class SiderComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('siderEle') siderEle!: ElementRef;

  isMobile = false;
  indexInfo!: PageIndexInfo;
  hotPosts: PostEntity[] = [];
  randomPosts: PostEntity[] = [];
  postArchives: ArchiveData[] = [];
  hotWallpapers: HotWallpaper[] = [];
  randomWallpapers: Wallpaper[] = [];
  wallpaperArchives: ArchiveData[] = [];

  private pageIndex = '';

  constructor(
    private readonly destroy$: DestroyService,
    private readonly platform: PlatformService,
    private readonly userAgentService: UserAgentService,
    private readonly commonService: CommonService,
    private readonly postService: PostService,
    private readonly wallpaperService: WallpaperService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngOnInit(): void {
    this.commonService.pageIndex$
      .pipe(
        skipWhile((page) => !page),
        takeUntil(this.destroy$)
      )
      .subscribe((page) => {
        if (this.pageIndex !== page) {
          this.pageIndex = page;
          this.indexInfo = this.commonService.getPageIndexInfo(page);

          if (!this.isMobile) {
            if (this.indexInfo.isPost || this.indexInfo.isTool || this.indexInfo.isHome) {
              this.getHotPosts();
              this.getRandomPosts();
              this.getPostArchives();
            }
            if (this.indexInfo.isWallpaper || this.indexInfo.isTool || this.indexInfo.isHome) {
              this.getHotWallpapers();
              this.getRandomWallpapers();
              this.getWallpaperArchives();
            }
          }
        }
      });
  }

  ngAfterViewInit(): void {
    if (this.platform.isBrowser) {
      window.addEventListener('scroll', this.scrollHandler.bind(this));
      window.addEventListener('resize', this.scrollHandler.bind(this));
    }
  }

  ngOnDestroy(): void {
    if (this.platform.isBrowser) {
      window.removeEventListener('scroll', this.scrollHandler);
      window.removeEventListener('resize', this.scrollHandler);
    }
  }

  getWallpaperLangParams(isCn: boolean): Params {
    return isCn ? {} : { lang: WallpaperLang.EN };
  }

  private getHotPosts() {
    this.postService
      .getHotPosts()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.hotPosts = res;
      });
  }

  private getRandomPosts() {
    this.postService
      .getRandomPosts(10, false)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.randomPosts = res;
      });
  }

  private getPostArchives() {
    this.postService
      .getPostArchives(true, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.postArchives = res;
      });
  }

  private getHotWallpapers() {
    this.wallpaperService
      .getHotWallpapers(10)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.hotWallpapers = res;
      });
  }

  private getRandomWallpapers() {
    this.wallpaperService
      .getRandomWallpapers(10, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.randomWallpapers = res;
      });
  }

  private getWallpaperArchives() {
    this.wallpaperService
      .getWallpaperArchives(true, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.wallpaperArchives = res;
      });
  }

  private scrollHandler() {
    const docEle = document.documentElement;
    if (this.siderEle && docEle.scrollTop > 0) {
      if (docEle.scrollTop > this.siderEle.nativeElement.scrollHeight - docEle.clientHeight) {
        this.siderEle.nativeElement.style.position = 'sticky';
        if (this.siderEle.nativeElement.scrollHeight < docEle.clientHeight) {
          this.siderEle.nativeElement.style.top = 0;
        } else {
          this.siderEle.nativeElement.style.top =
            docEle.clientHeight - this.siderEle.nativeElement.scrollHeight - 16 + 'px';
        }
      } else {
        this.siderEle.nativeElement.style.position = 'relative';
        this.siderEle.nativeElement.style.top = '';
      }
    }
  }
}
