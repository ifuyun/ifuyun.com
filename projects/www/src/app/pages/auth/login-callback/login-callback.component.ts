import { HttpStatusCode } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ADMIN_URL_PARAM,
  AppConfigService,
  AuthService,
  BreadcrumbService,
  CustomError,
  DestroyService,
  MetaService,
  OptionEntity,
  PlatformService,
  ResponseCode,
  SigninResponse
} from 'common/core';
import { TenantAppVo } from 'common/interfaces';
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
  private readonly destroy$ = inject(DestroyService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platform = inject(PlatformService);
  private readonly commonService = inject(CommonService);
  private readonly metaService = inject(MetaService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly appConfigService = inject(AppConfigService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);
  private readonly authService = inject(AuthService);

  protected readonly pageIndex = 'auth-signin';

  private appInfo = signal<TenantAppVo | null>(null);
  private options = signal<OptionEntity>({});
  private source = signal('');
  private authCode = signal('');
  private scope = signal('');
  private errorCode = signal('');
  private ref = signal('');
  private state = signal('');

  ngOnInit(): void {
    this.updatePageIndex();
    this.updateBreadcrumbs();

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$, this.route.queryParamMap])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options, qp]) => {
        this.appInfo.set(appInfo);
        this.options.set(options);
        this.source.set(qp.get('from')?.trim() || '');
        this.authCode.set(qp.get('auth_code')?.trim() || qp.get('code')?.trim() || '');
        this.scope.set(qp.get('scope')?.trim() || '');
        this.errorCode.set(qp.get('error_code')?.trim() || qp.get('error')?.trim() || '');
        this.ref.set(qp.get('ref')?.trim() || '');
        this.state.set(qp.get('state')?.trim() || '');

        this.updatePageInfo();

        if (!this.authCode()) {
          throw new CustomError('获取令牌超时或失败，请重新登录', HttpStatusCode.BadRequest);
        }
        if (!this.state()) {
          throw new CustomError('缺少state参数，请重新登录', HttpStatusCode.BadRequest);
        }

        try {
          const decodedState = JSON.parse(atob(this.state()));
          if (this.source() === 'github' && decodedState.ref) {
            this.ref.set(decodeURIComponent(decodedState.ref));
          } else {
            this.ref.set(decodeURIComponent(this.ref()));
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {}

        if (this.platform.isBrowser) {
          this.signin();
        }
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private signin() {
    if (this.source() === 'weibo' && this.errorCode() === '21330') {
      // cancel
      this.router.navigate(['/user/signin'], {
        replaceUrl: true,
        queryParams: {
          ref: this.ref() ? encodeURIComponent(this.ref()) : null
        }
      });
      return;
    }
    if (this.source() === 'github' && this.errorCode() === 'access_denied') {
      // cancel
      this.router.navigate(['/user/signin'], {
        replaceUrl: true,
        queryParams: {
          ref: this.ref() ? encodeURIComponent(this.ref()) : null
        }
      });
      return;
    }

    this.authService
      .oauthSignin(this.authCode(), this.source())
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const authInfo: SigninResponse = res.data || {};
        if (authInfo.token?.token) {
          // 不能用 router.navigate 跳转，否则会出现状态问题，并且会重复执行 signin() 两次
          const urlParam = format(ADMIN_URL_PARAM, authInfo.token.token, this.appConfigService.appId);

          location.replace(this.appInfo()!.adminUrl + '?' + urlParam);
        } else if (res.code === ResponseCode.USER_UNVERIFIED) {
          const user = authInfo.user;

          if (user?.userId) {
            this.router
              .navigate(['/user/confirm'], {
                relativeTo: this.route,
                replaceUrl: true,
                queryParams: {
                  userId: user.userId
                }
              })
              .then();
          }
        } else {
          throw new CustomError(res.message || '登录失败，请重新登录', HttpStatusCode.BadRequest);
        }
      });
  }

  private updatePageInfo() {
    this.metaService.updateHTMLMeta({
      title: ['登录', this.appInfo()!.name].join(' - '),
      description: this.appInfo()!.description,
      author: this.options()['site_author'],
      keywords: this.appInfo()!.keywords
    });
  }

  private updateBreadcrumbs() {
    this.breadcrumbService.updateBreadcrumbs([]);
  }
}
