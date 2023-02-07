import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import * as QRCode from 'qrcode';
import { combineLatestWith, skipWhile, takeUntil, tap } from 'rxjs';
import { environment as env } from '../../../../environments/environment';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { CommentObjectType } from '../../../components/comment/comment.enum';
import { CommentService } from '../../../components/comment/comment.service';
import { ImageService } from '../../../components/image/image.service';
import { MessageService } from '../../../components/message/message.service';
import { STORAGE_KEY_LIKED_WALLPAPER } from '../../../config/common.constant';
import { VoteType, VoteValue } from '../../../config/common.enum';
import { ResponseCode } from '../../../config/response-code.enum';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { PlatformService } from '../../../core/platform.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { filterHtmlTag, truncateString } from '../../../helpers/helper';
import { OptionEntity } from '../../../interfaces/option.interface';
import { Guest } from '../../../interfaces/user.interface';
import { OptionService } from '../../../services/option.service';
import { UserService } from '../../../services/user.service';
import { VoteEntity } from '../../post/vote.interface';
import { VoteService } from '../../post/vote.service';
import { BING_DOMAIN } from '../wallpaper.constant';
import { Wallpaper, WallpaperLang } from '../wallpaper.interface';
import { WallpaperService } from '../wallpaper.service';

@Component({
  selector: 'app-wallpaper',
  templateUrl: './wallpaper.component.html',
  styleUrls: ['./wallpaper.component.less'],
  providers: [DestroyService]
})
export class WallpaperComponent extends PageComponent implements OnInit, AfterViewInit {
  readonly bingDomain = BING_DOMAIN;
  readonly commentObjectType = CommentObjectType.WALLPAPER;

  isMobile = false;
  options: OptionEntity = {};
  lang = WallpaperLang.CN;
  wallpaperId = '';
  wallpaper!: Wallpaper;
  voteLoading = false;
  isLoggedIn = false;
  prevWallpaper: Wallpaper | null = null;
  nextWallpaper: Wallpaper | null = null;
  unknownLocation = '';

  protected pageIndex = 'wallpaper';

  private breadcrumbs: BreadcrumbEntity[] = [];
  private commentUser: Guest | null = null;
  private urlPrefix = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private platform: PlatformService,
    private userAgentService: UserAgentService,
    private destroy$: DestroyService,
    private metaService: MetaService,
    private commonService: CommonService,
    private breadcrumbService: BreadcrumbService,
    private optionService: OptionService,
    private userService: UserService,
    private wallpaperService: WallpaperService,
    private commentService: CommentService,
    private voteService: VoteService,
    private message: MessageService,
    private imageService: ImageService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updateActivePage();
    this.updatePageOptions();
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        combineLatestWith(this.route.paramMap, this.route.queryParamMap),
        takeUntil(this.destroy$),
        tap(([, params, queryParams]) => {
          this.wallpaperId = params.get('wid')?.trim() || '';
          this.lang = <WallpaperLang>queryParams.get('lang')?.trim() || WallpaperLang.CN;
          this.unknownLocation = this.lang === WallpaperLang.CN ? '未知' : 'Unknown';
          this.commentService.updateObjectId(this.wallpaperId);
        })
      )
      .subscribe(([options]) => {
        this.options = options;
        this.urlPrefix = env.production ? this.options['wallpaper_server'] : BING_DOMAIN;
        this.fetchWallpaper();
        this.fetchPrevAndNext();
      });
    this.userService.loginUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
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

  showWallpaper() {
    this.imageService.preview([
      {
        src: this.wallpaper?.url
      }
    ]);
  }

  download(uhd = false) {
    if (!this.isLoggedIn && uhd) {
      this.router.navigate(['/user/login'], { queryParams: { ref: `/wallpaper/${this.wallpaperId}` } });
      return;
    }
    const downloadUrl = this.wallpaperService.getDownloadUrl(this.wallpaperId, uhd);
    const token = localStorage.getItem('token');
    window.location.href = `${this.options['site_url']}${downloadUrl}${token ? '&token=' + token : ''}`;
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
    this.voteService
      .saveVote(voteData)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
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

  getTranslateLangParams(): Params {
    return this.lang === WallpaperLang.CN ? { lang: WallpaperLang.EN } : {};
  }

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.pageIndex);
  }

  private fetchWallpaper() {
    this.wallpaperService
      .getWallpaperById(this.wallpaperId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((wallpaper) => {
        if (wallpaper && wallpaper.wallpaperId) {
          this.wallpaper = {
            ...wallpaper,
            url: this.urlPrefix + wallpaper.url,
            hasTranslation:
              (this.lang === WallpaperLang.CN && !!wallpaper.storyEn) ||
              (this.lang === WallpaperLang.EN && !!wallpaper.story)
          };
          if (this.lang === WallpaperLang.CN) {
            this.wallpaper.copyright = wallpaper.copyright || wallpaper.copyrightEn;
            this.wallpaper.location = wallpaper.location || wallpaper.locationEn;
            this.wallpaper.storyTitle = wallpaper.storyTitle || wallpaper.storyTitleEn;
            this.wallpaper.story = wallpaper.story || wallpaper.storyEn;
          } else {
            this.wallpaper.copyright = wallpaper.copyrightEn || wallpaper.copyright;
            this.wallpaper.location = wallpaper.locationEn || wallpaper.location;
            this.wallpaper.storyTitle = wallpaper.storyTitleEn || wallpaper.storyTitle;
            this.wallpaper.story = wallpaper.storyEn || wallpaper.story;
          }
        }
        this.updatePageInfo();
        this.updateBreadcrumb();
        this.initWallpaperStatus();
      });
  }

  private fetchPrevAndNext() {
    this.wallpaperService
      .getWallpapersOfPrevAndNext(this.wallpaperId, this.lang)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.prevWallpaper = null;
        this.nextWallpaper = null;

        if (res.prevWallpaper) {
          this.prevWallpaper = {
            ...res.prevWallpaper,
            copyright: this.lang === WallpaperLang.CN ? res.prevWallpaper.copyright : res.prevWallpaper.copyrightEn,
            thumbUrl: this.urlPrefix + res.prevWallpaper.thumbUrl
          };
        }
        if (res.nextWallpaper) {
          this.nextWallpaper = {
            ...res.nextWallpaper,
            copyright: this.lang === WallpaperLang.CN ? res.nextWallpaper.copyright : res.nextWallpaper.copyrightEn,
            thumbUrl: this.urlPrefix + res.nextWallpaper.thumbUrl
          };
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
    let description = '';
    const fullStop = this.lang === WallpaperLang.EN ? '.' : '。';
    const comma = this.lang === WallpaperLang.EN ? ', ' : '，';
    const wallpaperLocation = this.wallpaper.location ? comma + this.wallpaper.location : '';

    if (this.wallpaper) {
      titles.unshift(this.wallpaper.copyright);
      description += `${this.wallpaper.copyright}${wallpaperLocation}`;
      description += description.endsWith(fullStop) ? '' : fullStop;
      if (this.lang === WallpaperLang.EN) {
        description += ' ';
      }
    }
    let story: string;
    if (this.lang === WallpaperLang.CN) {
      story = this.wallpaper.story || this.wallpaper.storyEn;
    } else {
      story = this.wallpaper.storyEn || this.wallpaper.story;
    }
    const wallpaperDesc = truncateString(filterHtmlTag(story), 160);

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description: `${description}${wallpaperDesc}`,
      keywords: this.options['wallpaper_keywords'],
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
        label: this.wallpaper?.copyright,
        tooltip: this.wallpaper?.copyright,
        url: '.',
        param: this.lang === WallpaperLang.EN ? { lang: WallpaperLang.EN } : {},
        isHeader: true
      }
    ];
    this.breadcrumbService.updateBreadcrumb(this.breadcrumbs);
  }
}
