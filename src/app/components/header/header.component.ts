import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageService } from 'ng-zorro-antd/image';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { skipWhile, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ADMIN_URL_PARAM, APP_ID } from '../../config/common.constant';
import { ResponseCode } from '../../config/response-code.enum';
import { ActionObjectType, ActionType } from '../../enums/log';
import { PageIndexInfo } from '../../interfaces/common';
import { TaxonomyNode } from '../../interfaces/taxonomy';
import { TenantAppModel } from '../../interfaces/tenant-app';
import { UserModel } from '../../interfaces/user';
import { TOOL_LINKS } from '../../pages/tool/tool.constant';
import { AuthService } from '../../services/auth.service';
import { CommonService } from '../../services/common.service';
import { DestroyService } from '../../services/destroy.service';
import { LogService } from '../../services/log.service';
import { TenantAppService } from '../../services/tenant-app.service';
import { UserAgentService } from '../../services/user-agent.service';
import { UserService } from '../../services/user.service';
import { format } from '../../utils/helper';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { WallpaperModalComponent } from '../wallpaper-modal/wallpaper-modal.component';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    CommonModule,
    FormsModule,
    NzInputModule,
    NzIconModule,
    NzButtonModule,
    NzSelectModule,
    LoginModalComponent,
    WallpaperModalComponent
  ],
  providers: [DestroyService, NzImageService],
  templateUrl: './header.component.html',
  styleUrl: './header.component.less'
})
export class HeaderComponent implements OnInit, AfterViewChecked {
  @Input() postTaxonomies: TaxonomyNode[] = [];
  @Input() gameTaxonomies: TaxonomyNode[] = [];

  @ViewChild('mSearchInput') mSearchInput!: ElementRef;

  readonly magazineUrl = environment.magazineUrl;

  isMobile = false;
  isSignIn = false;
  indexInfo?: PageIndexInfo;
  appInfo?: TenantAppModel;
  user!: UserModel;
  toolLinks = TOOL_LINKS;
  keyword = '';
  searchType = 'post';
  loginModalVisible = false;
  wallpaperModalVisible = false;
  searchVisible = false;
  isFocused = false;

  private adminUrl = '';
  private botsUrl = '';

  constructor(
    private readonly destroy$: DestroyService,
    private readonly router: Router,
    private readonly userAgentService: UserAgentService,
    private readonly message: NzMessageService,
    private readonly imageService: NzImageService,
    private readonly commonService: CommonService,
    private readonly tenantAppService: TenantAppService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly logService: LogService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngOnInit(): void {
    this.tenantAppService.appInfo$
      .pipe(
        skipWhile((appInfo) => isEmpty(appInfo)),
        takeUntil(this.destroy$)
      )
      .subscribe((appInfo) => {
        this.appInfo = appInfo;

        const urlParam = format(ADMIN_URL_PARAM, this.authService.getToken(), APP_ID);
        this.adminUrl = this.appInfo.appAdminUrl + '?' + urlParam;
        this.botsUrl = this.appInfo.appAdminUrl.replace(/\/$/i, '') + '/bots' + '?' + urlParam;
      });
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
    this.router.navigate(['/search'], {
      queryParams: {
        type: this.searchType,
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
    const previewRef = this.imageService.preview([
      {
        src: '/assets/images/red-packet.png'
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
    this.imageService.preview([
      {
        src: '/assets/images/wechat-card.png'
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
