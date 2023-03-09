import { CommonModule, DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import * as QRCode from 'qrcode';
import { skipWhile, takeUntil } from 'rxjs';
import { ArchiveData } from '../../core/common.interface';
import { CommonService } from '../../core/common.service';
import { DestroyService } from '../../core/destroy.service';
import { PlatformService } from '../../core/platform.service';
import { UrlService } from '../../core/url.service';
import { LinkEntity } from '../../interfaces/link.interface';
import { OptionEntity } from '../../interfaces/option.interface';
import { PostEntity } from '../../pages/post/post.interface';
import { PostService } from '../../pages/post/post.service';
import { WallpaperService } from '../../pages/wallpaper/wallpaper.service';
import { LinkService } from '../../services/link.service';
import { OptionService } from '../../services/option.service';
import { AdsenseComponent } from '../adsense/adsense.component';
import { JdUnionGoodsComponent } from '../jd-union-goods/jd-union-goods.component';
import { MessageService } from '../message/message.service';

@Component({
  selector: 'app-sider',
  templateUrl: './sider.component.html',
  styleUrls: ['./sider.component.less'],
  providers: [DestroyService],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdsenseComponent, JdUnionGoodsComponent]
})
export class SiderComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('redPacket') redPacketEle!: ElementRef;

  isMobile = false;
  activePage = '';
  postArchives: ArchiveData[] = [];
  wallpaperArchives: ArchiveData[] = [];
  hotPosts: PostEntity[] = [];
  randomPosts: PostEntity[] = [];
  friendLinks: LinkEntity[] = [];
  keyword = '';
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
    private message: MessageService
  ) {}

  ngOnInit(): void {
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => {
        this.options = options;
        this.showAlipayRedPacketQrcode();
      });
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
    this.commonService.disableAds$.pipe(takeUntil(this.destroy$)).subscribe((flag) => {
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
}
