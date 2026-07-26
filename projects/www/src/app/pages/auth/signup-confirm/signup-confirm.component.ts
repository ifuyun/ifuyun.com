import { HttpStatusCode } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ADMIN_URL_PARAM,
  AppConfigService,
  AuthService,
  BaseComponent,
  BreadcrumbService,
  CustomError,
  DestroyService,
  Message,
  MetaService,
  OptionEntity,
  PlatformService,
  ResponseCode,
  UserModel
} from 'common/core';
import { UserStatus } from 'common/enums';
import { TenantAppVo } from 'common/interfaces';
import { CommonService, OptionService, TenantAppService, UserService } from 'common/services';
import { format } from 'common/utils';
import { isEmpty } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'app-signup-confirm',
  imports: [ReactiveFormsModule, NzFormModule, NzInputModule, NzButtonModule],
  providers: [DestroyService],
  templateUrl: './signup-confirm.component.html',
  styleUrl: './signup-confirm.component.less'
})
export class SignupConfirmComponent extends BaseComponent implements OnInit, OnDestroy {
  private readonly destroy$ = inject(DestroyService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platform = inject(PlatformService);
  private readonly message = inject(NzMessageService);
  private readonly commonService = inject(CommonService);
  private readonly metaService = inject(MetaService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly appConfigService = inject(AppConfigService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);

  readonly confirmForm = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\s*\d{4}\s*$/i)]]
  });
  readonly confirmLoading = signal(false);
  readonly user = signal<UserModel | null>(null);
  readonly countdown = signal(60); // 60s

  protected readonly pageIndex = 'auth-signup';

  private readonly appInfo = signal<TenantAppVo | null>(null);
  private readonly options = signal<OptionEntity>({});
  private readonly userId = signal('');
  private readonly sendTimer = signal<number | null>(null);

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
        this.userId.set(qp.get('userId') || '');

        if (!this.userId()) {
          throw new CustomError(Message.USER_NOT_FOUND, HttpStatusCode.BadRequest);
        }

        this.updatePageInfo();
        this.getSignupUser();
        if (this.platform.isBrowser) {
          this.startCountdown();
        }
      });
  }

  ngOnDestroy() {
    if (this.sendTimer()) {
      window.clearInterval(this.sendTimer()!);
    }
  }

  verify() {
    const { value, valid } = this.validateForm(this.confirmForm);
    if (!valid) {
      return;
    }
    const { code } = value;
    this.confirmLoading.set(true);
    this.authService
      .verify(this.userId(), code)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.confirmLoading.set(false);

        if (res.token?.token) {
          const urlParam = format(ADMIN_URL_PARAM, res.token.token, this.appConfigService.appId);

          window.location.href = this.appInfo()!.adminUrl + '?' + urlParam;
        }
      });
  }

  resendCode() {
    this.startCountdown();
    this.authService
      .sendCode({
        id: this.userId()
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.code === ResponseCode.SUCCESS) {
          this.message.success('验证码已重新发送');
        }
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getSignupUser() {
    this.userService
      .getSignupUser(this.userId())
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.user.set(res);

        if (res.status === UserStatus.NORMAL) {
          this.message.info('账号已验证，无需重复验证');
          this.router.navigate(['/user/signin'], {
            relativeTo: this.route
          });
        }
      });
  }

  private startCountdown() {
    this.countdown.set(60);
    this.sendTimer.set(
      window.setInterval(() => {
        this.countdown.update((data) => data - 1);

        if (this.countdown() <= 0) {
          window.clearInterval(this.sendTimer()!);
        }
      }, 1000)
    );
  }

  private updatePageInfo() {
    const appInfo = this.appInfo()!;

    this.metaService.updateHTMLMeta({
      title: ['注册验证', appInfo.name].join(' - '),
      description: appInfo.description,
      author: this.options()['site_author'],
      keywords: appInfo.keywords
    });
  }

  private updateBreadcrumbs() {
    this.breadcrumbService.updateBreadcrumbs([]);
  }
}
