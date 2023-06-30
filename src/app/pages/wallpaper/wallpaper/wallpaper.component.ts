import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { NzImageService } from 'ng-zorro-antd/image';
import { NzMessageService } from 'ng-zorro-antd/message';
import * as QRCode from 'qrcode';
import { combineLatestWith, skipWhile, takeUntil, tap } from 'rxjs';
import { environment as env } from '../../../../environments/environment';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { CommentObjectType } from '../../../components/comment/comment.enum';
import { CommentService } from '../../../components/comment/comment.service';
import {
  PATH_WECHAT_MINI_APP_CARD,
  PATH_WECHAT_REWARD,
  STORAGE_KEY_LIKED_WALLPAPER
} from '../../../config/common.constant';
import { VoteType, VoteValue } from '../../../config/common.enum';
import { Message } from '../../../config/message.enum';
import { ResponseCode } from '../../../config/response-code.enum';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { PlatformService } from '../../../core/platform.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { filterHtmlTag, truncateString } from '../../../helpers/helper';
import { FavoriteType } from '../../../interfaces/favorite.enum';
import { Action, ActionObjectType } from '../../../interfaces/log.enum';
import { OptionEntity } from '../../../interfaces/option.interface';
import { Guest } from '../../../interfaces/user.interface';
import { VoteEntity } from '../../../interfaces/vote.interface';
import { FavoriteService } from '../../../services/favorite.service';
import { LogService } from '../../../services/log.service';
import { OptionService } from '../../../services/option.service';
import { UserService } from '../../user/user.service';
import { VoteService } from '../../../services/vote.service';
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
  readonly commentObjectType = CommentObjectType.WALLPAPER;
  readonly miniAppCardPath = PATH_WECHAT_MINI_APP_CARD;

  isMobile = false;
  options: OptionEntity = {};
  lang = WallpaperLang.CN;
  wallpaperId = '';
  wallpaper!: Wallpaper;
  voteLoading = false;
  isLoggedIn = false;
  prevWallpaper: Wallpaper | null = null;
  nextWallpaper: Wallpaper | null = null;
  isFavorite = false;
  favoriteLoading = false;

  protected pageIndex = 'wallpaper';

  private breadcrumbs: BreadcrumbEntity[] = [];
  private commentUser: Guest | null = null;
  private urlPrefix = '';
  private unknownLocation = '';

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
    private favoriteService: FavoriteService,
    private message: NzMessageService,
    private imageService: NzImageService,
    private logService: LogService
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
        src: this.wallpaper?.wallpaperUrl
      }
    ]);
  }

  showMiniAppCard() {
    this.imageService.preview([
      {
        src: this.miniAppCardPath
      }
    ]);
  }

  download(uhd = false) {
    if (!this.isLoggedIn && uhd) {
      this.router.navigate(['/user/login'], {
        queryParams: { ref: `/wallpaper/${this.wallpaperId}?lang=${this.lang}` }
      });
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
          this.wallpaper.wallpaperLikes = res.data.likes;
          this.wallpaper.wallpaperVoted = true;
          likedWallpapers.push(this.wallpaperId);
          localStorage.setItem(STORAGE_KEY_LIKED_WALLPAPER, uniq(likedWallpapers.filter((item) => !!item)).join(','));
        }
      });
  }

  showReward() {
    const previewRef = this.imageService.preview([
      {
        src: PATH_WECHAT_REWARD
      }
    ]);
    this.commonService.addPaddingToImagePreview(previewRef.previewInstance.imagePreviewWrapper);
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
        const previewRef = this.imageService.preview([
          {
            src: canvas.toDataURL()
          }
        ]);
        this.commonService.addPaddingToImagePreview(previewRef.previewInstance.imagePreviewWrapper);
      })
      .catch((err) => this.message.error(err));
  }

  addFavorite() {
    if (this.favoriteLoading || this.isFavorite) {
      return;
    }
    if (!this.isLoggedIn) {
      this.message.error(Message.ADD_FAVORITE_MUST_LOGIN);
      return;
    }
    this.favoriteLoading = true;
    this.favoriteService
      .addFavorite(this.wallpaperId, FavoriteType.WALLPAPER)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.favoriteLoading = false;
        if (res) {
          this.message.success(Message.ADD_FAVORITE_SUCCESS);
          this.isFavorite = true;
        }
      });
  }

  getLangParams(): Params {
    return this.lang === WallpaperLang.CN ? {} : { lang: this.lang };
  }

  getTranslateLangParams(): Params {
    return this.lang === WallpaperLang.CN ? { lang: WallpaperLang.EN } : {};
  }

  logTranslate() {
    this.logService
      .logAction({
        action: Action.TRANSLATE_WALLPAPER,
        objectType: ActionObjectType.WALLPAPER,
        objectId: this.wallpaperId,
        lang: this.lang === WallpaperLang.CN ? WallpaperLang.EN : WallpaperLang.CN
      })
      .subscribe();
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
            wallpaperUrl: this.urlPrefix + wallpaper.wallpaperUrl,
            wallpaperCopyrightAuthor: wallpaper.wallpaperCopyrightAuthor.replace(/^©\s*/i, '')
          };
          let wallpaperLocation = '';
          let hasTranslation: boolean;
          if (this.lang === WallpaperLang.CN) {
            wallpaperLocation = wallpaper.wallpaperLocation || wallpaper.wallpaperLocationEn;
            hasTranslation = !!wallpaper.wallpaperStoryEn;
            this.wallpaper.wallpaperTitle = wallpaper.wallpaperTitle || wallpaper.wallpaperTitleEn;
            this.wallpaper.wallpaperCopyright = wallpaper.wallpaperCopyright || wallpaper.wallpaperCopyrightEn;
            this.wallpaper.wallpaperStoryTitle = wallpaper.wallpaperStoryTitle || wallpaper.wallpaperStoryTitleEn;
            this.wallpaper.wallpaperStory = wallpaper.wallpaperStory || wallpaper.wallpaperStoryEn;
          } else {
            wallpaperLocation = wallpaper.wallpaperLocationEn || wallpaper.wallpaperLocation;
            hasTranslation = !!wallpaper.wallpaperStory;
            this.wallpaper.wallpaperTitle = wallpaper.wallpaperTitleEn || wallpaper.wallpaperTitle;
            this.wallpaper.wallpaperCopyright = wallpaper.wallpaperCopyrightEn || wallpaper.wallpaperCopyright;
            this.wallpaper.wallpaperStoryTitle = wallpaper.wallpaperStoryTitleEn || wallpaper.wallpaperStoryTitle;
            this.wallpaper.wallpaperStory = wallpaper.wallpaperStoryEn || wallpaper.wallpaperStory;
          }
          this.wallpaper.wallpaperLocation = wallpaperLocation || this.unknownLocation;
          this.wallpaper.hasTranslation = hasTranslation;
          this.isFavorite = wallpaper.isFavorite;
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
            wallpaperCopyright:
              this.lang === WallpaperLang.CN
                ? res.prevWallpaper.wallpaperCopyright
                : res.prevWallpaper.wallpaperCopyrightEn,
            wallpaperThumbUrl: this.urlPrefix + res.prevWallpaper.wallpaperThumbUrl
          };
        }
        if (res.nextWallpaper) {
          this.nextWallpaper = {
            ...res.nextWallpaper,
            wallpaperCopyright:
              this.lang === WallpaperLang.CN
                ? res.nextWallpaper.wallpaperCopyright
                : res.nextWallpaper.wallpaperCopyrightEn,
            wallpaperThumbUrl: this.urlPrefix + res.nextWallpaper.wallpaperThumbUrl
          };
        }
      });
  }

  private initWallpaperStatus() {
    if (this.platform.isBrowser) {
      const likedWallpapers = (localStorage.getItem(STORAGE_KEY_LIKED_WALLPAPER) || '').split(',');
      likedWallpapers.includes(this.wallpaper.wallpaperId) && (this.wallpaper.wallpaperVoted = true);
    }
  }

  private updatePageInfo() {
    const siteName: string = this.options['site_name'] || '';
    const titles: string[] = ['高清壁纸', siteName];
    let description = '';
    const fullStop = this.lang === WallpaperLang.EN ? '.' : '。';
    const comma = this.lang === WallpaperLang.EN ? ', ' : '，';
    const wallpaperLocation = this.wallpaper.wallpaperLocation ? comma + this.wallpaper.wallpaperLocation : '';

    if (this.wallpaper) {
      titles.unshift(this.wallpaper.wallpaperCopyright);
      description += `${this.wallpaper.wallpaperCopyright}${wallpaperLocation}`;
      description += description.endsWith(fullStop) ? '' : fullStop;
      if (this.lang === WallpaperLang.EN) {
        description += ' ';
      }
    }
    let story: string;
    if (this.lang === WallpaperLang.CN) {
      story = this.wallpaper.wallpaperStory || this.wallpaper.wallpaperStoryEn;
    } else {
      story = this.wallpaper.wallpaperStoryEn || this.wallpaper.wallpaperStory;
    }
    const wallpaperDesc = truncateString(filterHtmlTag(story), 140);

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
        label: this.wallpaper?.wallpaperCopyright,
        tooltip: this.wallpaper?.wallpaperCopyright,
        url: '.',
        param: this.lang === WallpaperLang.EN ? { lang: WallpaperLang.EN } : {},
        isHeader: true
      }
    ];
    this.breadcrumbService.updateBreadcrumb(this.breadcrumbs);
  }
}
