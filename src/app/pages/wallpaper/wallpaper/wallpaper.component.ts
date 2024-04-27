import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { saveAs } from 'file-saver';
import { isEmpty, uniq } from 'lodash';
import { NzImageService } from 'ng-zorro-antd/image';
import * as QRCode from 'qrcode';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { CommentObjectType } from '../../../components/comment/comment.enum';
import { CommentService } from '../../../components/comment/comment.service';
import {
  APP_ID,
  PATH_WECHAT_MINI_APP_CARD,
  PATH_WECHAT_REWARD,
  STORAGE_KEY_LIKED_WALLPAPER
} from '../../../config/common.constant';
import { VoteType, VoteValue } from '../../../config/common.enum';
import { Message } from '../../../config/message.enum';
import { ResponseCode } from '../../../config/response-code.enum';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { MessageService } from '../../../core/message.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { PlatformService } from '../../../core/platform.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { filterHtmlTag, truncateString } from '../../../helpers/helper';
import { FavoriteType } from '../../../interfaces/favorite.enum';
import { ActionType, ActionObjectType } from '../../../interfaces/log.enum';
import { OptionEntity } from '../../../interfaces/option.interface';
import { TenantAppModel } from '../../../interfaces/tenant-app.interface';
import { Guest } from '../../../interfaces/user.interface';
import { VoteEntity } from '../../../interfaces/vote.interface';
import { FavoriteService } from '../../../services/favorite.service';
import { LogService } from '../../../services/log.service';
import { OptionService } from '../../../services/option.service';
import { TenantAppService } from '../../../services/tenant-app.service';
import { VoteService } from '../../../services/vote.service';
import { UserService } from '../../user/user.service';
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
  downloading = false;
  loginModalVisible = false;

  get pageRef() {
    return `/wallpaper/${this.wallpaperId}?lang=${this.lang}`;
  }

  protected pageIndex = 'wallpaper';

  private appInfo!: TenantAppModel;
  private breadcrumbs: BreadcrumbEntity[] = [];
  private commentUser: Guest | null = null;
  private unknownLocation = '';

  constructor(
    private route: ActivatedRoute,
    private platform: PlatformService,
    private userAgentService: UserAgentService,
    private destroy$: DestroyService,
    private metaService: MetaService,
    private commonService: CommonService,
    private breadcrumbService: BreadcrumbService,
    private tenantAppService: TenantAppService,
    private optionService: OptionService,
    private userService: UserService,
    private wallpaperService: WallpaperService,
    private commentService: CommentService,
    private voteService: VoteService,
    private favoriteService: FavoriteService,
    private message: MessageService,
    private imageService: NzImageService,
    private logService: LogService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updateActivePage();
    this.updatePageOptions();

    combineLatest([
      this.tenantAppService.appInfo$,
      this.optionService.options$,
      this.route.paramMap,
      this.route.queryParamMap
    ])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options, p, qp]) => {
        this.appInfo = appInfo;
        this.options = options;
        this.wallpaperId = p.get('wid')?.trim() || '';
        this.lang = <WallpaperLang>qp.get('lang')?.trim() || WallpaperLang.CN;
        this.unknownLocation = this.lang === WallpaperLang.CN ? '未知' : 'Unknown';
        this.commentService.updateObjectId(this.wallpaperId);

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
    if (this.wallpaper?.wallpaperUrl) {
      this.imageService.preview([
        {
          src: this.wallpaper.wallpaperUrl
        }
      ]);
    }
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
      this.showLoginModal();
      return;
    }
    this.downloading = true;
    this.wallpaperService
      .downloadWallpaper(this.wallpaperId, uhd)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.downloading = false;

          const fileType = '.' + this.wallpaper.wallpaperImageFormat;
          const fileName = `${this.wallpaper.wallpaperCopyright}${uhd ? '_UHD' : ''}${fileType}`;
          saveAs(<Blob>res.body, fileName);
        },
        error: async (err: HttpErrorResponse) => {
          this.downloading = false;

          if (err.error instanceof Blob && err.error.type === 'application/json') {
            const resStr = await err.error.text();
            try {
              const res = JSON.parse(resStr);
              this.message.error(res.message || '下载失败');
            } catch (e) {
              this.message.error('下载失败');
            }
          }
        }
      });
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
      type: VoteType.WALLPAPER,
      appId: APP_ID
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
    const siteUrl = this.appInfo.appUrl.replace(/\/$/i, '');
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
        action: ActionType.TRANSLATE_WALLPAPER,
        objectType: ActionObjectType.WALLPAPER,
        objectId: this.wallpaperId,
        lang: this.lang === WallpaperLang.CN ? WallpaperLang.EN : WallpaperLang.CN,
        appId: APP_ID
      })
      .subscribe();
  }

  showLoginModal() {
    this.loginModalVisible = true;
  }

  closeLoginModal() {
    this.loginModalVisible = false;
  }

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.pageIndex);
  }

  protected updatePageOptions(): void {
    this.commonService.updatePageOptions({
      showHeader: true,
      showFooter: true,
      showMobileHeader: true,
      showMobileFooter: true
    });
  }

  private fetchWallpaper() {
    this.wallpaperService
      .getWallpaperById(this.wallpaperId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((wallpaper) => {
        if (wallpaper && wallpaper.wallpaperId) {
          this.wallpaper = {
            ...wallpaper,
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

          this.updatePageInfo();
          this.updateBreadcrumb();
          this.initWallpaperStatus();
        }
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
                : res.prevWallpaper.wallpaperCopyrightEn
          };
        }
        if (res.nextWallpaper) {
          this.nextWallpaper = {
            ...res.nextWallpaper,
            wallpaperCopyright:
              this.lang === WallpaperLang.CN
                ? res.nextWallpaper.wallpaperCopyright
                : res.nextWallpaper.wallpaperCopyrightEn
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
    const titles: string[] = [this.wallpaper.wallpaperCopyright, '高清壁纸', this.appInfo.appName];
    let description = '';
    const fullStop = this.lang === WallpaperLang.EN ? '.' : '。';
    const comma = this.lang === WallpaperLang.EN ? ', ' : '，';
    const wallpaperLocation = this.wallpaper?.wallpaperLocation ? comma + this.wallpaper.wallpaperLocation : '';

    description += `${this.wallpaper.wallpaperCopyright}${wallpaperLocation}`;
    description += description.endsWith(fullStop) ? '' : fullStop;
    if (this.lang === WallpaperLang.EN) {
      description += ' ';
    }
    const wallpaperDesc = truncateString(filterHtmlTag(this.wallpaper.wallpaperStory), 140);

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description: `${description}${wallpaperDesc}`,
      keywords: this.options['wallpaper_keywords'],
      author: this.options['site_author']
    });
  }

  private updateBreadcrumb(): void {
    this.breadcrumbs = <BreadcrumbEntity[]>[
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
