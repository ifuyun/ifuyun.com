import { CommonModule, DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import * as QRCode from 'qrcode';
import { skipWhile, takeUntil } from 'rxjs';
import { environment as env } from '../../../environments/environment';
import { PostType } from '../../config/common.enum';
import { ArchiveData } from '../../core/common.interface';
import { CommonService } from '../../core/common.service';
import { DestroyService } from '../../core/destroy.service';
import { MessageService } from '../../core/message.service';
import { PlatformService } from '../../core/platform.service';
import { UrlService } from '../../core/url.service';
import { LinkEntity } from '../../interfaces/link.interface';
import { Action, ActionObjectType } from '../../interfaces/log.enum';
import { OptionEntity } from '../../interfaces/option.interface';
import { PostEntity } from '../../pages/post/post.interface';
import { PostService } from '../../pages/post/post.service';
import { WallpaperService } from '../../pages/wallpaper/wallpaper.service';
import { LinkService } from '../../services/link.service';
import { LogService } from '../../services/log.service';
import { OptionService } from '../../services/option.service';
import { AdsenseComponent } from '../adsense/adsense.component';
import { JdUnionGoodsComponent } from '../jd-union-goods/jd-union-goods.component';

@Component({
  selector: 'app-sider',
  templateUrl: './sider.component.html',
  styleUrls: ['./sider.component.less'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdsenseComponent, JdUnionGoodsComponent],
  providers: [DestroyService]
})
export class SiderComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('redPacket') redPacketEle!: ElementRef;

  isMobile = false;
  pageIndex = '';
  isHomePage = false;
  isPostPage = false;
  isWallpaperPage = false;
  isPromptPage = false;
  postArchives: ArchiveData[] = [];
  promptArchives: ArchiveData[] = [];
  wallpaperArchives: ArchiveData[] = [];
  hotPosts: PostEntity[] = [];
  randomPosts: PostEntity[] = [];
  friendLinks: LinkEntity[] = [];
  keyword = '';
  enableAds = false;
  jdUnionVisible = false;

  private options: OptionEntity = {};

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private destroy$: DestroyService,
    private platform: PlatformService,
    private router: Router,
    private urlService: UrlService,
    private commonService: CommonService,
    private optionService: OptionService,
    private postService: PostService,
    private linkService: LinkService,
    private wallpaperService: WallpaperService,
    private message: MessageService,
    private logService: LogService
  ) {}

  ngOnInit(): void {
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => {
        this.options = options;
        const enableAds = this.options['enable_ads'] || '';
        this.enableAds =
          (env.production && ['1', '0'].includes(enableAds)) || (!env.production && ['2', '0'].includes(enableAds));
        if (this.platform.isBrowser) {
          this.showAlipayRedPacketQrcode();
        }
      });
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
    this.commonService.adsFlag$.pipe(takeUntil(this.destroy$)).subscribe((flag) => {
      this.jdUnionVisible = flag;
    });
    this.commonService.pageIndex$
      .pipe(
        skipWhile((page) => !page),
        takeUntil(this.destroy$)
      )
      .subscribe((page) => {
        this.pageIndex = page;
        this.updatePageIndex();
        if (this.isHomePage || this.isPostPage) {
          this.fetchPostArchives();
        }
        if (this.isHomePage || this.isPromptPage) {
          this.fetchPromptArchives();
        }
        if (this.isHomePage || this.isWallpaperPage) {
          this.fetchWallpaperArchives();
        }
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
      this.logService
        .logAction({
          action: Action.SEARCH,
          objectType: ActionObjectType.SEARCH,
          keyword: this.keyword
        })
        .subscribe();
      this.router.navigate(['/'], { queryParams: { keyword: this.keyword } });
    }
  }

  private fetchPostArchives() {
    this.postService
      .getPostArchives({
        showCount: true
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => (this.postArchives = res));
  }

  private fetchPromptArchives() {
    this.postService
      .getPostArchives({
        postType: PostType.PROMPT,
        showCount: true
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => (this.promptArchives = res));
  }

  private fetchWallpaperArchives() {
    this.wallpaperService
      .getWallpaperArchives({
        showCount: true
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => (this.wallpaperArchives = res));
  }

  private showAlipayRedPacketQrcode() {
    QRCode.toCanvas(this.options['alipay_red_packet_code'], {
      width: 560,
      margin: 0
    })
      .then((canvas) => {
        canvas.removeAttribute('style');
        const imageEle = this.document.createElement('img');
        imageEle.src = canvas.toDataURL();
        imageEle.alt = '支付宝红包';
        imageEle.style.maxWidth = '100%';
        this.redPacketEle.nativeElement.innerHTML = '';
        this.redPacketEle.nativeElement.appendChild(imageEle);
        this.redPacketEle.nativeElement.style.display = 'block';
      })
      .catch((err) => this.message.error(err));
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

  private updatePageIndex() {
    this.isHomePage = this.pageIndex === 'index';
    this.isPostPage = ['post', 'postArchive'].includes(this.pageIndex);
    this.isWallpaperPage = ['wallpaper', 'wallpaperArchive'].includes(this.pageIndex);
    this.isPromptPage = ['prompt', 'promptArchive'].includes(this.pageIndex);
  }
}
