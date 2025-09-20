import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { TenantAppModel } from 'common/interfaces';
import { CommonService, OptionService, TenantAppService } from 'common/services';
import { format } from 'common/utils';
import { isEmpty } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'app-forgot',
  imports: [FormsModule, ReactiveFormsModule, NzFormModule, NzIconModule, NzInputModule, NzButtonModule],
  providers: [DestroyService],
  templateUrl: './forgot.component.html',
  styleUrl: './forgot.component.less'
})
export class ForgotComponent extends BaseComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('emailInput') emailInput!: ElementRef;

  readonly maxEmailLength = USER_EMAIL_LENGTH;
  readonly minPwdLength = USER_PASSWORD_MIN_LENGTH;
  readonly maxPwdLength = USER_PASSWORD_MAX_LENGTH;

  forgotForm!: FormGroup;
  countdown = 0; // 60s
  passwordVisible = false;
  resetLoading = false;

  protected pageIndex = 'auth-forgot';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private sendTimer!: number;

  constructor(
    private readonly destroy$: DestroyService,
    private readonly platform: PlatformService,
    private readonly fb: FormBuilder,
    private readonly message: NzMessageService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly appConfigService: AppConfigService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly authService: AuthService
  ) {
    super();
    this.forgotForm = this.fb.group({
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
  }

  ngOnInit(): void {
    this.updatePageIndex();
    this.updateBreadcrumbs();

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        this.appInfo = appInfo;
        this.options = options;

        this.updatePageInfo();
      });
  }

  ngAfterViewInit() {
    if (this.platform.isBrowser) {
      this.emailInput.nativeElement.focus();
    }
  }

  ngOnDestroy() {
    if (this.sendTimer) {
      window.clearInterval(this.sendTimer);
    }
  }

  sendVerificationCode() {
    const emailCtrl = this.forgotForm.get('email');
    if (!emailCtrl || !emailCtrl.valid) {
      return;
    }
    this.countdown = 60;
    this.startCountdown();
    this.authService
      .sendCode({
        email: emailCtrl.value
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
    if (this.resetLoading || !valid) {
      return;
    }
    const { email, code, password } = value;
    this.resetLoading = true;
    this.authService
      .resetPassword({
        email,
        code,
        password
      })
      .subscribe((res) => {
        this.resetLoading = false;

        if (res.token?.accessToken) {
          const urlParam = format(ADMIN_URL_PARAM, res.token.accessToken, this.appConfigService.appId);
          window.location.href = this.appInfo.appAdminUrl + '?' + urlParam;
        }
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private startCountdown() {
    this.sendTimer = window.setInterval(() => {
      this.countdown -= 1;
      if (this.countdown <= 0) {
        window.clearInterval(this.sendTimer);
      }
    }, 1000);
  }

  private cancelCountdown() {
    this.countdown = 0;
    window.clearInterval(this.sendTimer);
  }

  private updatePageInfo() {
    this.metaService.updateHTMLMeta({
      title: ['忘记密码', this.appInfo.appName].join(' - '),
      description: this.appInfo.appDescription,
      author: this.options['site_author'],
      keywords: this.appInfo.appKeywords
    });
  }

  private updateBreadcrumbs() {
    this.breadcrumbService.updateBreadcrumbs([]);
  }
}
