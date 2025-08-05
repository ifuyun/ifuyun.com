import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ADMIN_URL_PARAM,
  AppConfigService,
  AppDomainConfig,
  AuthService,
  DestroyService,
  PageIndexInfo,
  ResponseCode,
  UserAgentService,
  UserModel
} from 'common/core';
import { ActionObjectType, ActionType, SearchType, TaxonomyType } from 'common/enums';
import { TaxonomyNode, TenantAppModel } from 'common/interfaces';
import { CommonService, LogService, TaxonomyService, TenantAppService, UserService } from 'common/services';
import { format } from 'common/utils';
import { isEmpty } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageService } from 'ng-zorro-antd/image';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { skipWhile, takeUntil } from 'rxjs';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { SmartLinkComponent } from '../smart-link/smart-link.component';
import { WallpaperModalComponent } from '../wallpaper/wallpaper-modal/wallpaper-modal.component';
import { TOOL_LINKS } from './tool.constant';

@Component({
  selector: 'lib-header',
  imports: [
    RouterLink,
    FormsModule,
    NzInputModule,
    NzIconModule,
    NzButtonModule,
    NzSelectModule,
    LoginModalComponent,
    WallpaperModalComponent,
    SmartLinkComponent
  ],
  providers: [DestroyService, NzImageService],
  templateUrl: './header.component.html',
  styleUrl: './header.component.less'
})
export class HeaderComponent implements OnInit, AfterViewChecked {
  @ViewChild('mSearchInput') mSearchInput!: ElementRef;

  readonly faviconUrl: string;
  readonly magazineUrl: string;
  readonly searchTypeMap: Record<string, string> = {
    [SearchType.ALL]: '全站',
    [SearchType.POST]: '博客',
    [SearchType.WALLPAPER]: '壁纸',
    [SearchType.GAME]: '游戏'
  };

  isMobile = false;
  isSignIn = false;
  domains!: AppDomainConfig;
  indexInfo?: PageIndexInfo;
  appInfo?: TenantAppModel;
  user!: UserModel;
  postTaxonomies: TaxonomyNode[] = [];
  gameTaxonomies: TaxonomyNode[] = [];
  toolLinks = TOOL_LINKS;
  keyword = '';
  searchType = 'all';
  loginModalVisible = false;
  wallpaperModalVisible = false;
  searchVisible = false;
  isFocused = false;

  private adminUrl = '';
  private botsUrl = '';

  constructor(
    private readonly destroy$: DestroyService,
    private readonly userAgentService: UserAgentService,
    private readonly message: NzMessageService,
    private readonly imageService: NzImageService,
    private readonly commonService: CommonService,
    private readonly appConfigService: AppConfigService,
    private readonly tenantAppService: TenantAppService,
    private readonly taxonomyService: TaxonomyService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly logService: LogService
  ) {
    this.domains = appConfigService.apps;
    this.faviconUrl = appConfigService.faviconUrl;
    this.magazineUrl = appConfigService.magazineUrl;
    this.isMobile = userAgentService.isMobile;
  }

  ngOnInit(): void {
    this.tenantAppService.appInfo$
      .pipe(
        skipWhile((appInfo) => isEmpty(appInfo)),
        takeUntil(this.destroy$)
      )
      .subscribe((appInfo) => {
        const urlParam = format(ADMIN_URL_PARAM, this.authService.getToken(), this.appConfigService.appId);

        this.appInfo = appInfo;
        if (this.appInfo.appAdminUrl) {
          this.adminUrl = this.appInfo.appAdminUrl + '?' + urlParam;
          this.botsUrl = this.appInfo.appAdminUrl.replace(/\/$/i, '') + '/bots' + '?' + urlParam;
        }
      });
    this.taxonomyService.getTaxonomies().subscribe((taxonomies) => (this.postTaxonomies = taxonomies));
    this.taxonomyService.getTaxonomies(TaxonomyType.GAME).subscribe((taxonomies) => (this.gameTaxonomies = taxonomies));
    this.commonService.pageIndex$.pipe(takeUntil(this.destroy$)).subscribe((page) => {
      this.indexInfo = this.commonService.getPageIndexInfo(page);
    });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user = user;
      this.isSignIn = !!user.userId;
    });
  }

  ngAfterViewChecked(): void {
    if (!this.isFocused && this.mSearchInput) {
      this.mSearchInput.nativeElement.focus();
      this.isFocused = true;
    }
  }

  search(): void {
    this.keyword = this.keyword.trim();
    if (!this.keyword) {
      this.message.error('请输入搜索关键词');
      if (this.isMobile) {
        this.mSearchInput.nativeElement.focus();
      }
      return;
    }
    this.commonService.smartNavigate('/search', this.domains['www'].url, {
      queryParams: {
        type: this.searchType === 'all' ? undefined : this.searchType,
        keyword: this.keyword
      }
    });
  }

  showSearch() {
    this.searchVisible = true;
  }

  hideSearch() {
    this.searchVisible = false;
    this.isFocused = false;
  }

  gotoBots() {
    if (!this.isSignIn) {
      this.showLoginModal();
      return;
    }
    window.open(this.botsUrl);
  }

  showLoginModal() {
    this.loginModalVisible = true;
  }

  closeLoginModal() {
    this.loginModalVisible = false;
  }

  showWallpaperModal() {
    this.wallpaperModalVisible = true;

    this.logService
      .logAction({
        action: ActionType.SHOW_WALLPAPER_MODAL,
        objectType: ActionObjectType.HEADER
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  closeWallpaperModal() {
    this.wallpaperModalVisible = false;
  }

  showRedPacket() {
    const urlPrefix = this.commonService.getCdnUrlPrefix();
    const previewRef = this.imageService.preview([
      {
        src: urlPrefix + '/assets/images/red-packet.png'
      }
    ]);
    this.commonService.paddingPreview(previewRef.previewInstance.imagePreviewWrapper);

    this.logService
      .logAction({
        action: ActionType.SHOW_RED_PACKET,
        objectType: ActionObjectType.HEADER
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  showWechatCard() {
    const urlPrefix = this.commonService.getCdnUrlPrefix();

    this.imageService.preview([
      {
        src: urlPrefix + '/assets/images/wechat-card.png'
      }
    ]);

    this.logService
      .logAction({
        action: ActionType.SHOW_WECHAT_CARD,
        objectType: ActionObjectType.HEADER
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  gotoAdmin() {
    window.open(this.adminUrl);
  }

  logout() {
    this.authService
      .logout()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.code === ResponseCode.SUCCESS) {
          location.reload();
        }
      });
  }

  showSider() {
    this.commonService.updateSiderVisible(true);
  }

  logRSS(isWallpaper = false) {
    this.logService
      .logAction({
        action: isWallpaper ? ActionType.OPEN_WALLPAPER_RSS : ActionType.OPEN_POST_RSS,
        objectType: ActionObjectType.HEADER
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }
}
