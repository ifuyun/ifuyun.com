import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  USER_EMAIL_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_PASSWORD_MIN_LENGTH,
  USER_PASSWORD_PATTERN
} from 'common/components';
import {
  ADMIN_URL_PARAM,
  AppConfigService,
  AuthService,
  BaseComponent,
  BreadcrumbService,
  DestroyService,
  MetaService,
  OptionEntity,
  PlatformService,
  ResponseCode
} from 'common/core';
import { TenantAppVo } from 'common/interfaces';
import { CommonService, OptionService, TenantAppService } from 'common/services';
import { format } from 'common/utils';
import { isEmpty } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpaceCompactComponent } from 'ng-zorro-antd/space';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'app-forgot',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzSpaceCompactComponent
  ],
  providers: [DestroyService],
  templateUrl: './forgot.component.html'
})
export class ForgotComponent extends BaseComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = inject(DestroyService);
  private readonly platform = inject(PlatformService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly commonService = inject(CommonService);
  private readonly metaService = inject(MetaService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly appConfigService = inject(AppConfigService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);
  private readonly authService = inject(AuthService);

  readonly emailInput = viewChild.required<ElementRef<HTMLInputElement>>('emailInput');

  readonly maxEmailLength = USER_EMAIL_LENGTH;
  readonly minPwdLength = USER_PASSWORD_MIN_LENGTH;
  readonly maxPwdLength = USER_PASSWORD_MAX_LENGTH;

  readonly forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(this.maxEmailLength)]],
    code: ['', [Validators.required, Validators.pattern(/^\s*\d{4}\s*$/i)]],
    password: [
      null,
      [
        Validators.required,
        Validators.minLength(this.minPwdLength),
        Validators.maxLength(this.maxPwdLength),
        Validators.pattern(USER_PASSWORD_PATTERN)
      ]
    ]
  });
  readonly countdown = signal(0); // 60s
  readonly resetLoading = signal(false);

  protected readonly pageIndex = 'auth-forgot';

  private readonly appInfo = signal<TenantAppVo | null>(null);
  private readonly options = signal<OptionEntity>({});
  private readonly sendTimer = signal<number | null>(null);

  ngOnInit(): void {
    this.updatePageIndex();
    this.updateBreadcrumbs();

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        this.appInfo.set(appInfo);
        this.options.set(options);

        this.updatePageInfo();
      });
  }

  ngAfterViewInit() {
    if (this.platform.isBrowser) {
      this.emailInput().nativeElement.focus();
    }
  }

  ngOnDestroy() {
    if (this.sendTimer()) {
      window.clearInterval(this.sendTimer()!);
    }
  }

  sendVerificationCode() {
    const emailCtrl = this.forgotForm.get('email');
    if (!emailCtrl || !emailCtrl.valid) {
      return;
    }
    this.countdown.set(60);
    this.startCountdown();
    this.authService
      .sendCode({
        email: emailCtrl.value!
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.code === ResponseCode.SUCCESS) {
          this.message.success('验证码已发送');
        } else {
          this.cancelCountdown();
        }
      });
  }

  resetPassword() {
    const { value, valid } = this.validateForm(this.forgotForm);
    if (this.resetLoading() || !valid) {
      return;
    }
    const { email, code, password } = value;
    this.resetLoading.set(true);
    this.authService
      .resetPassword({
        email,
        code,
        password
      })
      .subscribe((res) => {
        this.resetLoading.set(false);

        if (res.token?.token) {
          const urlParam = format(ADMIN_URL_PARAM, res.token.token, this.appConfigService.appId);
          window.location.href = this.appInfo()!.adminUrl + '?' + urlParam;
        }
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private startCountdown() {
    this.sendTimer.set(
      window.setInterval(() => {
        this.countdown.update((data) => data - 1);

        if (this.countdown() <= 0) {
          window.clearInterval(this.sendTimer()!);
        }
      }, 1000)
    );
  }

  private cancelCountdown() {
    this.countdown.set(0);

    window.clearInterval(this.sendTimer()!);
  }

  private updatePageInfo() {
    this.metaService.updateHTMLMeta({
      title: ['忘记密码', this.appInfo()!.name].join(' - '),
      description: this.appInfo()!.description,
      author: this.options()['site_author'],
      keywords: this.appInfo()!.keywords
    });
  }

  private updateBreadcrumbs() {
    this.breadcrumbService.updateBreadcrumbs([]);
  }
}
