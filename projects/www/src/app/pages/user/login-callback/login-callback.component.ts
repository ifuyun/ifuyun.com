import { HttpStatusCode } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ADMIN_URL_PARAM,
  AppConfigService,
  AuthService,
  BreadcrumbService,
  CustomError,
  DestroyService,
  LoginResponse,
  MetaService,
  OptionEntity,
  PlatformService,
  ResponseCode
} from 'common/core';
import { TenantAppModel } from 'common/interfaces';
import { CommonService, OptionService, TenantAppService } from 'common/services';
import { format } from 'common/utils';
import { isEmpty } from 'lodash';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'app-login-callback',
  imports: [NzIconModule],
  providers: [DestroyService],
  templateUrl: './login-callback.component.html',
  styleUrl: './login-callback.component.less'
})
export class LoginCallbackComponent implements OnInit {
  protected pageIndex = 'auth-login';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private source = '';
  private authCode = '';
  private scope = '';
  private errorCode = '';
  private ref = '';
  private state = '';

  constructor(
    private readonly destroy$: DestroyService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly platform: PlatformService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly appConfigService: AppConfigService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.updatePageIndex();
    this.updateBreadcrumbs();

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$, this.route.queryParamMap])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options, qp]) => {
        this.appInfo = appInfo;
        this.options = options;
        this.source = qp.get('from')?.trim() || '';
        this.authCode = qp.get('auth_code')?.trim() || qp.get('code')?.trim() || '';
        this.scope = qp.get('scope')?.trim() || '';
        this.errorCode = qp.get('error_code')?.trim() || qp.get('error')?.trim() || '';
        this.ref = qp.get('ref')?.trim() || '';
        this.state = qp.get('state')?.trim() || '';

        this.updatePageInfo();

        if (!this.authCode) {
          throw new CustomError('获取令牌超时或失败，请重新登录', HttpStatusCode.BadRequest);
        }
        if (!this.state) {
          throw new CustomError('缺少state参数，请重新登录', HttpStatusCode.BadRequest);
        }

        try {
          const decodedState = JSON.parse(atob(this.state));
          if (this.source === 'github' && decodedState.ref) {
            this.ref = decodeURIComponent(decodedState.ref);
          } else {
            this.ref = decodeURIComponent(this.ref);
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {}

        if (this.platform.isBrowser) {
          this.login();
        }
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private login() {
    if (this.source === 'weibo' && this.errorCode === '21330') {
      // cancel
      this.router.navigate(['/user/login'], {
        replaceUrl: true,
        queryParams: {
          ref: this.ref ? encodeURIComponent(this.ref) : null
        }
      });
      return;
    }
    if (this.source === 'github' && this.errorCode === 'access_denied') {
      // cancel
      this.router.navigate(['/user/login'], {
        replaceUrl: true,
        queryParams: {
          ref: this.ref ? encodeURIComponent(this.ref) : null
        }
      });
      return;
    }

    this.authService
      .thirdLogin(this.authCode, this.source)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const authInfo: LoginResponse = res.data || {};
        if (authInfo.token?.accessToken) {
          // 不能用 router.navigate 跳转，否则会出现状态问题，并且会重复执行 login() 两次
          const urlParam = format(ADMIN_URL_PARAM, authInfo.token.accessToken, this.appConfigService.appId);
          location.replace(this.appInfo.appAdminUrl + '?' + urlParam);
        } else if (res.code === ResponseCode.USER_UNVERIFIED) {
          const user = authInfo.user;
          if (user?.userId) {
            this.router.navigate(['/user/confirm'], {
              relativeTo: this.route,
              replaceUrl: true,
              queryParams: {
                userId: user.userId
              }
            });
          }
        } else {
          throw new CustomError(res.message || '登录失败，请重新登录', HttpStatusCode.BadRequest);
        }
      });
  }

  private updatePageInfo() {
    this.metaService.updateHTMLMeta({
      title: ['登录', this.appInfo.appName].join(' - '),
      description: this.appInfo.appDescription,
      author: this.options['site_author'],
      keywords: this.appInfo.appKeywords
    });
  }

  private updateBreadcrumbs() {
    this.breadcrumbService.updateBreadcrumbs([]);
  }
}
