import { Component, OnInit } from '@angular/core';
import {
  ADMIN_URL_PARAM,
  AppConfigService,
  AppDomainConfig,
  AuthService,
  DestroyService,
  PageIndexInfo,
  ResponseCode
} from 'common/core';
import { LogTargetType, LogActionType } from 'common/enums';
import { IconCalendarDateComponent } from 'common/icons';
import { TenantAppVo } from 'common/interfaces';
import { CommonService, LogService, TenantAppService, UserService } from 'common/services';
import { format } from 'common/utils';
import { isEmpty } from 'lodash';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageService } from 'ng-zorro-antd/image';
import { skipWhile, takeUntil } from 'rxjs';
import { SmartLinkComponent } from '../smart-link/smart-link.component';

@Component({
  selector: 'lib-m-sider',
  imports: [NzIconModule, SmartLinkComponent, IconCalendarDateComponent],
  providers: [DestroyService, NzImageService],
  templateUrl: './m-sider.component.html',
  styleUrl: './m-sider.component.less'
})
export class MSiderComponent implements OnInit {
  readonly faviconUrl: string;
  readonly magazineUrl: string;

  siderVisible = false;
  isSignIn = false;
  domains!: AppDomainConfig;
  indexInfo?: PageIndexInfo;
  appInfo?: TenantAppVo;

  private adminUrl = '';

  constructor(
    private readonly destroy$: DestroyService,
    private readonly imageService: NzImageService,
    private readonly commonService: CommonService,
    private readonly appConfigService: AppConfigService,
    private readonly tenantAppService: TenantAppService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly logService: LogService
  ) {
    this.domains = appConfigService.apps;
    this.faviconUrl = appConfigService.faviconUrl;
    this.magazineUrl = appConfigService.magazineUrl;
  }

  ngOnInit(): void {
    this.tenantAppService.appInfo$
      .pipe(
        skipWhile((appInfo) => isEmpty(appInfo)),
        takeUntil(this.destroy$)
      )
      .subscribe((appInfo) => {
        this.appInfo = appInfo;

        const urlParam = format(ADMIN_URL_PARAM, this.authService.getToken(), this.appConfigService.appId);
        this.adminUrl = this.appInfo.adminUrl + '?' + urlParam;
      });
    this.commonService.siderVisible$.subscribe((visible) => {
      this.siderVisible = visible;
    });
    this.commonService.pageIndex$.pipe(takeUntil(this.destroy$)).subscribe((page) => {
      this.indexInfo = this.commonService.getPageIndexInfo(page);
    });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.isSignIn = !!user.id;
    });
  }

  closeSider() {
    this.siderVisible = false;
    this.commonService.updateSiderVisible(false);
  }

  showWechatCard() {
    const urlPrefix = this.commonService.getCdnUrlPrefix();

    this.siderVisible = false;
    this.commonService.updateSiderVisible(false);
    this.imageService.preview([
      {
        src: urlPrefix + '/assets/images/wechat-card.png'
      }
    ]);

    this.logService
      .logAction({
        action: LogActionType.SHOW_WECHAT_CARD,
        targetType: LogTargetType.SIDER
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  gotoAdmin() {
    window.open(this.adminUrl);
  }

  signout() {
    this.authService
      .signout()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.code === ResponseCode.SUCCESS) {
          location.reload();
        }
      });
  }
}
