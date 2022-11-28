import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import * as QRCode from 'qrcode';
import { combineLatestWith, skipWhile, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { ImageService } from '../../../components/image/image.service';
import { MessageService } from '../../../components/message/message.service';
import { VoteType, VoteValue } from '../../../config/common.enum';
import { STORAGE_KEY_LIKED_WALLPAPER } from '../../../config/constants';
import { ResponseCode } from '../../../config/response-code.enum';
import { CommonService } from '../../../core/common.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { PlatformService } from '../../../core/platform.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { OptionEntity } from '../../../interfaces/option.interface';
import { Guest } from '../../../interfaces/user.interface';
import { OptionService } from '../../../services/option.service';
import { UserService } from '../../../services/user.service';
import { VoteEntity } from '../../post/vote.interface';
import { VoteService } from '../../post/vote.service';
import {
  BING_DOMAIN,
  DEFAULT_WALLPAPER_RESOLUTION,
  WALLPAPER_PAGE_DESCRIPTION,
  WALLPAPER_PAGE_KEYWORDS
} from '../wallpaper.constant';
import { Wallpaper, WallpaperLang } from '../wallpaper.interface';
import { WallpaperService } from '../wallpaper.service';

@Component({
  selector: 'app-wallpaper',
  templateUrl: './wallpaper.component.html',
  styleUrls: ['./wallpaper.component.less']
})
export class WallpaperComponent extends PageComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly bingDomain = BING_DOMAIN;

  isMobile = false;
  options: OptionEntity = {};
  lang = WallpaperLang.CN;
  wallpaperId = '';
  wallpaper!: Wallpaper;
  voteLoading = false;
  isLoggedIn = false;
  prevWallpaper: Wallpaper | null = null;
  nextWallpaper: Wallpaper | null = null;

  get queryParams(): Params {
    if (this.lang === WallpaperLang.CN) {
      return {};
    }
    return {
      lang: this.lang
    };
  }

  protected pageIndex = 'wallpaper';

  private breadcrumbs: BreadcrumbEntity[] = [];
  private commentUser: Guest | null = null;

  private optionsListener!: Subscription;
  private paramListener!: Subscription;
  private wallpaperListener!: Subscription;
  private userListener!: Subscription;
  private prevAndNextListener!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private optionService: OptionService,
    private commonService: CommonService,
    private breadcrumbService: BreadcrumbService,
    private metaService: MetaService,
    private wallpaperService: WallpaperService,
    private platform: PlatformService,
    private voteService: VoteService,
    private userService: UserService,
    private message: MessageService,
    private userAgentService: UserAgentService,
    private imageService: ImageService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updateActivePage();
    this.updatePageOptions();
    this.optionsListener = this.optionService.options$
      .pipe(skipWhile((options) => isEmpty(options)))
      .subscribe((options) => {
        this.options = options;
      });
    this.paramListener = this.route.paramMap
      .pipe(
        combineLatestWith(this.route.queryParamMap),
        tap(([params, queryParams]) => {
          this.wallpaperId = params.get('wid')?.trim() || '';
          this.lang = <WallpaperLang>queryParams.get('lang')?.trim() || WallpaperLang.CN;
        })
      )
      .subscribe(() => {
        this.fetchWallpaper();
        this.fetchPrevAndNext();
      });
    this.userListener = this.userService.loginUser$.subscribe((user) => {
      this.isLoggedIn = !!user.userId;
    });
  }

  ngAfterViewInit() {
    if (this.platform.isBrowser) {
      const commentUser = this.userService.getCommentUser();
      if (commentUser) {
        this.commentUser = { ...commentUser };
      }
    }
  }

  ngOnDestroy(): void {
    this.optionsListener.unsubscribe();
    this.paramListener.unsubscribe();
    this.wallpaperListener.unsubscribe();
  }

  showWallpaper() {
    this.imageService.preview([
      {
        src: this.wallpaper?.fullUrl
      }
    ]);
  }

  download(uhd = false) {
    const url = uhd ? this.wallpaper.fullUhdUrl : this.wallpaper.fullUrl;
    if (!this.isLoggedIn && uhd) {
      return this.message.error('下载 4k 超高清壁纸请先登录');
    }
    if (!this.isLoggedIn) {
      this.wallpaperService.increaseDownload(this.wallpaperId).subscribe();
      window.open(url);
      return;
    }
    window.location.href = `${this.options['site_url']}${this.wallpaperService.getDownloadUrl(this.wallpaperId, uhd)}`;
  }

  voteWallpaper(like = true) {
    const likedWallpapers = (localStorage.getItem(STORAGE_KEY_LIKED_WALLPAPER) || '').split(',');
    if (likedWallpapers.includes(this.wallpaperId) || this.voteLoading) {
      return;
    }
    this.voteLoading = true;
    const voteData: VoteEntity = {
      objectId: this.wallpaperId,
      value: like ? VoteValue.LIKE : VoteValue.DISLIKE,
      type: VoteType.WALLPAPER
    };
    if (this.commentUser && this.commentUser.name) {
      voteData.user = this.commentUser;
    }
    this.voteService.saveVote(voteData).subscribe((res) => {
      this.voteLoading = false;
      if (res.code === ResponseCode.SUCCESS) {
        this.wallpaper.likes = res.data.likes;
        if (like) {
          this.wallpaper.liked = true;
          likedWallpapers.push(this.wallpaperId);
          localStorage.setItem(STORAGE_KEY_LIKED_WALLPAPER, uniq(likedWallpapers.filter((item) => !!item)).join(','));
        }
      }
    });
  }

  showReward(src: string) {
    this.imageService.preview([
      {
        src,
        padding: 16
      }
    ]);
  }

  showShareQrcode() {
    const siteUrl = this.options['site_url'].replace(/\/$/i, '');
    const langParam = this.lang === WallpaperLang.EN ? '&lang=' + this.lang : '';
    const shareUrl = `${siteUrl}/wallpaper/${this.wallpaper.wallpaperId}?ref=qrcode${langParam}`;

    QRCode.toCanvas(shareUrl, {
      width: 320,
      margin: 0
    })
      .then((canvas) => {
        this.imageService.preview([
          {
            src: canvas.toDataURL(),
            padding: 16
          }
        ]);
      })
      .catch((err) => this.message.error(err));
  }

  getLangParams(): Params {
    return this.lang === WallpaperLang.CN ? {} : { lang: this.lang };
  }

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.pageIndex);
  }

  private fetchWallpaper() {
    this.wallpaperListener = this.wallpaperService.getWallpaperById(this.wallpaperId).subscribe((wallpaper) => {
      if (wallpaper && wallpaper.wallpaperId) {
        this.wallpaper = {
          ...wallpaper,
          fullUrl: `${BING_DOMAIN}${wallpaper.urlBase}_${DEFAULT_WALLPAPER_RESOLUTION}.${wallpaper.imageFormat}`,
          fullUhdUrl: `${BING_DOMAIN}${wallpaper.urlBase}_UHD.${wallpaper.imageFormat}`,
          fullCopyrightUrl: `${BING_DOMAIN}${wallpaper.copyrightLink}`
        };
        if (this.lang === WallpaperLang.CN) {
          this.wallpaper.title = wallpaper.title || wallpaper.titleEn;
          this.wallpaper.copyright = wallpaper.copyright || wallpaper.copyrightEn;
          this.wallpaper.story = wallpaper.story || wallpaper.storyEn;
        } else {
          this.wallpaper.title = wallpaper.titleEn || wallpaper.title;
          this.wallpaper.copyright = wallpaper.copyrightEn || wallpaper.copyright;
          this.wallpaper.story = wallpaper.storyEn || wallpaper.story;
        }
      }
      this.updatePageInfo();
      this.updateBreadcrumb();
      this.initWallpaperStatus();
    });
  }

  private fetchPrevAndNext() {
    this.prevAndNextListener = this.wallpaperService
      .getWallpapersOfPrevAndNext(this.wallpaperId, this.lang)
      .subscribe((res) => {
        this.prevWallpaper = null;
        this.nextWallpaper = null;

        if (res.prevWallpaper) {
          this.prevWallpaper = {
            ...res.prevWallpaper,
            fullUrl: `${BING_DOMAIN}${res.prevWallpaper.urlBase}_${DEFAULT_WALLPAPER_RESOLUTION}.${res.prevWallpaper.imageFormat}`
          };
          if (this.lang === WallpaperLang.CN) {
            this.prevWallpaper.title = this.prevWallpaper.title || this.prevWallpaper.titleEn;
          } else {
            this.prevWallpaper.title = this.prevWallpaper.titleEn || this.prevWallpaper.title;
          }
        }
        if (res.nextWallpaper) {
          this.nextWallpaper = {
            ...res.nextWallpaper,
            fullUrl: `${BING_DOMAIN}${res.nextWallpaper.urlBase}_${DEFAULT_WALLPAPER_RESOLUTION}.${res.nextWallpaper.imageFormat}`
          };
          if (this.lang === WallpaperLang.CN) {
            this.nextWallpaper.title = this.nextWallpaper.title || this.nextWallpaper.titleEn;
          } else {
            this.nextWallpaper.title = this.nextWallpaper.titleEn || this.nextWallpaper.title;
          }
        }
      });
  }

  private initWallpaperStatus() {
    if (this.platform.isBrowser) {
      const likedWallpapers = (localStorage.getItem(STORAGE_KEY_LIKED_WALLPAPER) || '').split(',');
      likedWallpapers.includes(this.wallpaper.wallpaperId) && (this.wallpaper.liked = true);
    }
  }

  private updatePageInfo() {
    const siteName: string = this.options['site_name'] || '';
    const titles: string[] = ['高清壁纸', siteName];
    const keywords: string[] = (this.options['site_keywords'] || '').split(',');
    let description = '';

    if (this.wallpaper) {
      if (this.lang === WallpaperLang.CN) {
        titles.unshift(this.wallpaper.copyright);
        description += `${this.wallpaper.copyright} (${this.wallpaper.copyrightAuthor})。`;
      } else {
        titles.unshift(this.wallpaper.copyrightEn || this.wallpaper.copyright);
        description += `${this.wallpaper.copyrightEn} (${this.wallpaper.copyrightAuthor}). `;
      }
    }

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description: `${description}${siteName}${WALLPAPER_PAGE_DESCRIPTION}`,
      keywords: uniq(WALLPAPER_PAGE_KEYWORDS.concat(keywords)).join(','),
      author: this.options['site_author']
    });
  }

  protected updatePageOptions(): void {
    this.commonService.updatePageOptions({
      showHeader: true,
      showFooter: true,
      showMobileHeader: true,
      showMobileFooter: true
    });
  }

  private updateBreadcrumb(): void {
    this.breadcrumbs = [
      {
        label: '壁纸',
        tooltip: '高清壁纸',
        url: '/wallpaper',
        param: this.lang === WallpaperLang.EN ? { lang: WallpaperLang.EN } : {},
        isHeader: false
      },
      {
        label: this.wallpaper?.title,
        tooltip: this.wallpaper?.title,
        url: '.',
        param: this.lang === WallpaperLang.EN ? { lang: WallpaperLang.EN } : {},
        isHeader: true
      }
    ];
    this.breadcrumbService.updateCrumb(this.breadcrumbs);
  }
}
