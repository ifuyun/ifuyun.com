import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BaseComponent } from '../../base.component';
import { ADMIN_URL_PARAM, APP_ID } from '../../config/common.constant';
import { ResponseCode } from '../../config/response-code.enum';
import { LoginResponse } from '../../interfaces/auth';
import { OptionEntity } from '../../interfaces/option';
import { TenantAppModel } from '../../interfaces/tenant-app';
import { USER_EMAIL_LENGTH, USER_PASSWORD_MAX_LENGTH } from '../../pages/auth/auth.constant';
import { AuthService } from '../../services/auth.service';
import { DestroyService } from '../../services/destroy.service';
import { OptionService } from '../../services/option.service';
import { TenantAppService } from '../../services/tenant-app.service';
import { UserAgentService } from '../../services/user-agent.service';
import { format } from '../../utils/helper';
import md5 from '../../utils/md5';

@Component({
  selector: 'app-login-form',
  imports: [
    NgIf,
    RouterLink,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzDividerModule
  ],
  providers: [DestroyService],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.less'
})
export class LoginFormComponent extends BaseComponent implements OnInit {
  @Input() isModal = true;
  @Input() padding = false;
  @Output() closeForm = new EventEmitter();

  readonly maxLoginLength = USER_EMAIL_LENGTH;
  readonly maxPasswordLength = USER_PASSWORD_MAX_LENGTH;

  loginForm!: FormGroup;
  passwordVisible = false;
  loginLoading = false;
  thirdLogin: Record<string, boolean> = {
    wechat: false,
    qq: false,
    alipay: false,
    weibo: false,
    github: false
  };

  get enableSignup() {
    return this.options['open_signup'] === '1';
  }

  get enableThirdLogin() {
    return (
      this.thirdLogin['wechat'] ||
      this.thirdLogin['qq'] ||
      this.thirdLogin['alipay'] ||
      this.thirdLogin['weibo'] ||
      this.thirdLogin['github']
    );
  }

  private isMobile = false;
  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private referrer = '';

  constructor(
    private readonly destroy$: DestroyService,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly message: NzMessageService,
    private readonly userAgentService: UserAgentService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly authService: AuthService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile;
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.maxLength(this.maxLoginLength)]],
      password: [null, [Validators.required, Validators.maxLength(this.maxPasswordLength)]]
    });
  }

  ngOnInit(): void {
    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$, this.route.queryParamMap])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options, qp]) => {
        this.appInfo = appInfo;
        this.options = options;
        this.thirdLogin['alipay'] = !!options['open_alipay_app_id'];
        this.thirdLogin['weibo'] = !!options['open_weibo_app_key'];
        this.thirdLogin['github'] = !!options['open_github_client_id'];

        const ref = qp.get('ref')?.trim() || '';
        try {
          this.referrer = decodeURIComponent(ref);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          this.referrer = ref;
        }
        if (ref === 'logout') {
          this.authService.clearAuth();
        }
      });
  }

  login() {
    const { value, valid } = this.validateForm(this.loginForm);
    if (!valid) {
      return;
    }
    const { username, password } = value;
    this.loginLoading = true;
    this.authService
      .login({
        username,
        password: md5(password)
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.loginLoading = false;
        const authInfo: LoginResponse = res.data || {};

        if (authInfo.token?.accessToken) {
          const urlParam = format(ADMIN_URL_PARAM, authInfo.token.accessToken, APP_ID);
          let redirectUrl: string;
          if (!this.isModal) {
            if (this.referrer && this.referrer !== 'logout') {
              const separator = this.referrer.indexOf('?') >= 0 ? '&' : '?';
              if (/^https?:\/\//i.test(this.referrer)) {
                // 绝对路径
                redirectUrl = this.referrer + separator + urlParam;
              } else {
                // 相对路径，不需要带上token
                redirectUrl = this.appInfo.appUrl + '/' + this.referrer.replace(/^\//i, '');
              }
            } else {
              redirectUrl = this.appInfo.appAdminUrl + '?' + urlParam;
            }
            location.href = redirectUrl;
          } else {
            location.reload();
          }
        } else if (res.code === ResponseCode.USER_UNVERIFIED) {
          const user = authInfo.user || {};
          if (user.userId) {
            this.closeForm.emit();
            this.router.navigate(['/user/confirm'], {
              queryParams: {
                userId: user.userId
              }
            });
          }
        }
      });
  }

  gotoThirdLogin(type: string): void {
    if (!this.thirdLogin[type]) {
      this.message.warning('Sorry, we are stepping up our efforts to launch this feature, please wait...');
      return;
    }
    const url = this.authService.getThirdLoginURL({
      type,
      options: this.options,
      callbackUrl: this.appInfo.appCallbackUrl,
      ref: '',
      isMobile: this.isMobile
    });
    if (url) {
      location.href = url;
    }
  }
}
