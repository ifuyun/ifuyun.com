import { NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageService } from 'ng-zorro-antd/image';
import { skipWhile, takeUntil } from 'rxjs';
import { ADMIN_URL_PARAM, APP_ID } from 'src/app/config/common.constant';
import { ResponseCode } from 'src/app/config/response-code.enum';
import { ActionObjectType, ActionType } from 'src/app/enums/log';
import { PageIndexInfo } from 'src/app/interfaces/common';
import { TenantAppModel } from 'src/app/interfaces/tenant-app';
import { AuthService } from 'src/app/services/auth.service';
import { CommonService } from 'src/app/services/common.service';
import { DestroyService } from 'src/app/services/destroy.service';
import { LogService } from 'src/app/services/log.service';
import { TenantAppService } from 'src/app/services/tenant-app.service';
import { UserService } from 'src/app/services/user.service';
import { format } from 'src/app/utils/helper';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-m-sider',
  imports: [NgIf, RouterLink, NzIconModule],
  providers: [DestroyService, NzImageService],
  templateUrl: './m-sider.component.html',
  styleUrl: './m-sider.component.less'
})
export class MSiderComponent implements OnInit {
  readonly magazineUrl = environment.magazineUrl;

  siderVisible = false;
  isSignIn = false;
  indexInfo?: PageIndexInfo;
  appInfo?: TenantAppModel;

  private adminUrl = '';

  constructor(
    private readonly destroy$: DestroyService,
    private readonly imageService: NzImageService,
    private readonly commonService: CommonService,
    private readonly tenantAppService: TenantAppService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly logService: LogService
  ) {}

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
      });
    this.commonService.siderVisible$.subscribe((visible) => {
      this.siderVisible = visible;
    });
    this.commonService.pageIndex$.pipe(takeUntil(this.destroy$)).subscribe((page) => {
      this.indexInfo = this.commonService.getPageIndexInfo(page);
    });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.isSignIn = !!user.userId;
    });
  }

  closeSider() {
    this.siderVisible = false;
    this.commonService.updateSiderVisible(false);
  }

  showWechatCard() {
    this.siderVisible = false;
    this.commonService.updateSiderVisible(false);
    this.imageService.preview([
      {
        src: '/assets/images/wechat-card.png'
      }
    ]);

    this.logService
      .logAction({
        action: ActionType.SHOW_WECHAT_CARD,
        objectType: ActionObjectType.SIDER
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
}
