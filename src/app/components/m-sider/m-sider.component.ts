import { NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageService } from 'ng-zorro-antd/image';
import { skipWhile, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ADMIN_URL_PARAM, APP_ID } from '../../config/common.constant';
import { ResponseCode } from '../../config/response-code.enum';
import { ActionObjectType, ActionType } from '../../enums/log';
import { PageIndexInfo } from '../../interfaces/common';
import { TenantAppModel } from '../../interfaces/tenant-app';
import { UserModel } from '../../interfaces/user';
import { AuthService } from '../../services/auth.service';
import { CommonService } from '../../services/common.service';
import { DestroyService } from '../../services/destroy.service';
import { LogService } from '../../services/log.service';
import { TenantAppService } from '../../services/tenant-app.service';
import { UserService } from '../../services/user.service';
import { format } from '../../utils/helper';

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
