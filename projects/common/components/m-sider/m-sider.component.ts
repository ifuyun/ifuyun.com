import { Component, inject, OnInit, signal } from '@angular/core';
import {
  ADMIN_URL_PARAM,
  AppConfigService,
  AuthService,
  DestroyService,
  PageIndexInfo,
  ResponseCode
} from 'common/core';
import { LogActionType, LogTargetType } from 'common/enums';
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
  private readonly destroy$ = inject(DestroyService);
  private readonly imageService = inject(NzImageService);
  private readonly commonService = inject(CommonService);
  private readonly appConfigService = inject(AppConfigService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly logService = inject(LogService);

  readonly faviconUrl = this.appConfigService.faviconUrl;
  readonly magazineUrl = this.appConfigService.magazineUrl;

  readonly siderVisible = signal(false);
  readonly isSignIn = signal(false);
  readonly domains = this.appConfigService.apps;
  readonly indexInfo = signal<PageIndexInfo | null>(null);
  readonly appInfo = signal<TenantAppVo | null>(null);

  private readonly adminUrl = signal('');

  ngOnInit(): void {
    this.tenantAppService.appInfo$
      .pipe(
        skipWhile((appInfo) => isEmpty(appInfo)),
        takeUntil(this.destroy$)
      )
      .subscribe((appInfo) => {
        this.appInfo.set(appInfo);

        const urlParam = format(ADMIN_URL_PARAM, this.authService.getToken(), this.appConfigService.appId);

        this.adminUrl.set(appInfo.adminUrl + '?' + urlParam);
      });
    this.commonService.siderVisible$.subscribe((visible) => {
      this.siderVisible.set(visible);
    });
    this.commonService.pageIndex$.pipe(takeUntil(this.destroy$)).subscribe((page) => {
      this.indexInfo.set(this.commonService.getPageIndexInfo(page));
    });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.isSignIn.set(!!user.id);
    });
  }

  closeSider() {
    this.siderVisible.set(false);

    this.commonService.updateSiderVisible(false);
  }

  showWechatCard() {
    const urlPrefix = this.commonService.getCdnUrlPrefix();

    this.siderVisible.set(false);

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
    window.open(this.adminUrl());
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
