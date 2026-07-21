import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  ADMIN_URL_PARAM,
  AppConfigService,
  AppDomainConfig,
  AuthService,
  BaseComponent,
  DestroyService,
  OptionEntity,
  ResponseCode,
  SigninResponse,
  UserAgentService
} from 'common/core';
import { TenantAppVo } from 'common/interfaces';
import { CommonService, OptionService, TenantAppService } from 'common/services';
import { format } from 'common/utils';
import { isEmpty } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { SmartLinkComponent } from '../smart-link/smart-link.component';
import { USER_EMAIL_LENGTH, USER_PASSWORD_MAX_LENGTH } from './auth.constant';

@Component({
  selector: 'lib-signin-form',
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzDividerModule,
    SmartLinkComponent
  ],
  providers: [DestroyService],
  templateUrl: './signin-form.component.html',
  styleUrl: './signin-form.component.less'
})
export class SigninFormComponent extends BaseComponent implements OnInit {
  @Input() isModal = true;
  @Input() padding = false;
  @Output() closeForm = new EventEmitter();

  readonly maxNameLength = USER_EMAIL_LENGTH;
  readonly maxPasswordLength = USER_PASSWORD_MAX_LENGTH;

  domains!: AppDomainConfig;
  signinForm!: FormGroup;
  signinLoading = false;
  oauthMap: Record<string, boolean> = {
    wechat: false,
    qq: false,
    alipay: false,
    weibo: false,
    github: false
  };

  get enableSignup() {
    return this.options['open_signup'] === '1';
  }

  get enableOauth() {
    return (
      this.oauthMap['wechat'] ||
      this.oauthMap['qq'] ||
      this.oauthMap['alipay'] ||
      this.oauthMap['weibo'] ||
      this.oauthMap['github']
    );
  }

  private readonly isMobile: boolean = false;
  private appInfo!: TenantAppVo;
  private options: OptionEntity = {};
  private referrer = '';

  constructor(
    private readonly destroy$: DestroyService,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly message: NzMessageService,
    private readonly userAgentService: UserAgentService,
    private readonly appConfigService: AppConfigService,
    private readonly commonService: CommonService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly authService: AuthService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile;
    this.domains = this.appConfigService.apps;
    this.signinForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(this.maxNameLength)]],
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
        this.oauthMap['alipay'] = !!options['open_alipay_app_id'];
        this.oauthMap['weibo'] = !!options['open_weibo_app_key'];
        this.oauthMap['github'] = !!options['open_github_client_id'];

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

  signin() {
    const { value, valid } = this.validateForm(this.signinForm);
    if (!valid) {
      return;
    }
    const { name, password } = value;
    this.signinLoading = true;
    this.authService
      .signin({
        name,
        password
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.signinLoading = false;
        const authInfo: SigninResponse = res.data || {};

        if (authInfo.token?.token) {
          const urlParam = format(ADMIN_URL_PARAM, authInfo.token.token, this.appConfigService.appId);
          let redirectUrl: string;
          if (!this.isModal) {
            if (this.referrer && this.referrer !== 'logout') {
              const separator = this.referrer.indexOf('?') >= 0 ? '&' : '?';
              if (/^https?:\/\//i.test(this.referrer)) {
                // 绝对路径
                redirectUrl = this.referrer + separator + urlParam;
              } else {
                // 相对路径，不需要带上token
                redirectUrl = this.appInfo.homeUrl + '/' + this.referrer.replace(/^\//i, '');
              }
            } else {
              redirectUrl = this.appInfo.adminUrl + '?' + urlParam;
            }
            location.href = redirectUrl;
          } else {
            location.reload();
          }
        } else if (res.code === ResponseCode.USER_UNVERIFIED) {
          const user = authInfo.user || {};

          if (user.userId) {
            this.closeForm.emit();
            this.commonService.smartNavigate('/user/confirm', this.domains['www'].url, {
              queryParams: {
                userId: user.userId
              }
            });
          }
        }
      });
  }

  oauthSignin(type: string): void {
    if (!this.oauthMap[type]) {
      this.message.warning('Sorry, we are stepping up our efforts to launch this feature, please wait...');
      return;
    }
    const url = this.authService.getOauthURL({
      type,
      options: this.options,
      callbackUrl: this.appInfo.callbackUrl,
      ref: '',
      isMobile: this.isMobile
    });
    if (url) {
      location.href = url;
    }
  }
}
