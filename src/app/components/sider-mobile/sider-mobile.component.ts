import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { NzImageService } from 'ng-zorro-antd/image';
import { skipWhile, takeUntil } from 'rxjs';
import { ADMIN_URL_PARAM, APP_ID, PATH_FAVICON, PATH_WECHAT_CARD } from '../../config/common.constant';
import { Theme } from '../../config/common.enum';
import { ResponseCode } from '../../config/response-code.enum';
import { CommonService } from '../../core/common.service';
import { DestroyService } from '../../core/destroy.service';
import { PlatformService } from '../../core/platform.service';
import { UserAgentService } from '../../core/user-agent.service';
import { format } from '../../helpers/helper';
import { TenantAppModel } from '../../interfaces/tenant-app.interface';
import { UserModel } from '../../interfaces/user.interface';
import { AuthService } from '../../pages/user/auth.service';
import { UserService } from '../../pages/user/user.service';
import { TenantAppService } from '../../services/tenant-app.service';

@Component({
  selector: 'app-sider-mobile',
  templateUrl: './sider-mobile.component.html',
  styleUrls: ['./sider-mobile.component.less'],
  standalone: true,
  imports: [CommonModule, RouterLink],
  providers: [DestroyService]
})
export class SiderMobileComponent implements OnInit {
  @Input() siderOpen = false;
  @Output() siderOpenChange = new EventEmitter<boolean>();

  readonly logoUrl = PATH_FAVICON;

  appInfo!: TenantAppModel;
  darkMode = false;
  isMobile = false;
  activePage = '';
  user!: UserModel;
  isLoggedIn = false;
  adminUrl = '';

  constructor(
    private destroy$: DestroyService,
    private userAgentService: UserAgentService,
    private platform: PlatformService,
    private commonService: CommonService,
    private tenantAppService: TenantAppService,
    private userService: UserService,
    private authService: AuthService,
    private imageService: NzImageService
  ) {
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.commonService.darkMode$.pipe(takeUntil(this.destroy$)).subscribe((darkMode) => {
      this.darkMode = darkMode;
    });
    this.tenantAppService.appInfo$
      .pipe(
        skipWhile((appInfo) => isEmpty(appInfo)),
        takeUntil(this.destroy$)
      )
      .subscribe((appInfo) => {
        this.appInfo = appInfo;

        if (this.platform.isBrowser) {
          this.adminUrl =
            this.appInfo.appAdminUrl +
            format(ADMIN_URL_PARAM, this.authService.getToken(), this.authService.getExpiration(), APP_ID);
        }
      });
    this.commonService.pageIndex$
      .pipe(takeUntil(this.destroy$))
      .subscribe((pageIndex) => (this.activePage = pageIndex));
    this.userService.loginUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user = user;
      this.isLoggedIn = !!this.user.userId;
    });
  }

  changeTheme() {
    const theme = this.darkMode ? Theme.Light : Theme.Dark;
    this.commonService.updateTheme(theme);
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

  showWechatQrcode() {
    this.siderOpen = false;
    this.siderOpenChange.emit(this.siderOpen);
    this.imageService.preview([
      {
        src: PATH_WECHAT_CARD
      }
    ]);
  }
}
