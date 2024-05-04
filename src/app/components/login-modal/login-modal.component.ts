import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { isEmpty } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { CookieService } from 'ngx-cookie-service';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { ADMIN_URL_PARAM, APP_ID } from '../../config/common.constant';
import { ResponseCode } from '../../config/response-code.enum';
import { BaseComponent } from '../../core/base.component';
import { DestroyService } from '../../core/destroy.service';
import { MessageService } from '../../core/message.service';
import { UserAgentService } from '../../core/user-agent.service';
import { format } from '../../helpers/helper';
import md5 from '../../helpers/md5';
import { OptionEntity } from '../../interfaces/option.interface';
import { TenantAppModel } from '../../interfaces/tenant-app.interface';
import { UserModel } from '../../interfaces/user.interface';
import { LoginResponse } from '../../pages/user/auth.interface';
import { AuthService } from '../../pages/user/auth.service';
import { USER_EMAIL_LENGTH, USER_PASSWORD_MAX_LENGTH } from '../../pages/user/user.constant';
import { UserService } from '../../pages/user/user.service';
import { OptionService } from '../../services/option.service';
import { TenantAppService } from '../../services/tenant-app.service';

@Component({
  selector: 'i-login-modal',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NzMessageModule,
    NzButtonModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzModalModule
  ],
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.less']
})
export class LoginModalComponent extends BaseComponent implements OnInit {
  @Input() ref = '';
  @Output() closeModal = new EventEmitter();

  readonly maxLoginLength = USER_EMAIL_LENGTH;
  readonly maxPasswordLength = USER_PASSWORD_MAX_LENGTH;

  isMobile = false;
  loginForm = this.fb.group({
    username: [this.cookieService.get('user') || '', [Validators.required, Validators.maxLength(this.maxLoginLength)]],
    password: [null, [Validators.required, Validators.maxLength(this.maxPasswordLength)]]
  });
  passwordVisible = false;
  loginLoading = false;

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private adminUrl = '';

  constructor(
    @Inject(DOCUMENT) protected document: Document,
    private router: Router,
    private fb: FormBuilder,
    private userAgentService: UserAgentService,
    private destroy$: DestroyService,
    private tenantAppService: TenantAppService,
    private optionService: OptionService,
    private cookieService: CookieService,
    private authService: AuthService,
    private message: MessageService,
    private userService: UserService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        this.appInfo = appInfo;
        this.options = options;
        this.adminUrl = this.appInfo.appAdminUrl;
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
        username: username || '',
        password: md5(password || ''),
        appId: APP_ID
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.loginLoading = false;
        const loginRes: LoginResponse = res.data || {};

        if (res.code === ResponseCode.SUCCESS && loginRes.token.accessToken) {
          const urlParam = format(ADMIN_URL_PARAM, loginRes.token.accessToken, APP_ID);
          let redirectUrl: string;
          if (this.ref) {
            if (/^https?:\/\//i.test(this.ref)) {
              // 绝对路径
              redirectUrl = this.ref;
            } else {
              // 相对路径
              redirectUrl = this.appInfo.appUrl + '/' + this.ref.replace(/^\//i, '');
            }
          } else {
            redirectUrl = this.adminUrl + urlParam;
          }

          this.closeLoginModal();
          window.location.href = redirectUrl;
        } else if (res.code === ResponseCode.USER_UNVERIFIED) {
          const user: UserModel = res.data?.user || {};
          if (user.userId) {
            this.closeLoginModal();
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
    if (!['alipay', 'weibo', 'github'].includes(type)) {
      this.message.warning('Sorry, we are stepping up our efforts to launch this feature, please wait...');
      return;
    }
    if (isEmpty(this.options)) {
      return;
    }
    const url = this.userService.getThirdLoginURL({
      type,
      options: this.options,
      appInfo: this.appInfo,
      ref: this.ref,
      isMobile: this.isMobile
    });
    if (url) {
      this.closeLoginModal();
      location.href = url;
    }
  }

  closeLoginModal() {
    this.closeModal.emit();
  }
}
