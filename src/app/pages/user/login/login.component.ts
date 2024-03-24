import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { CookieService } from 'ngx-cookie-service';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { ADMIN_URL_PARAM, APP_ID } from '../../../config/common.constant';
import { ResponseCode } from '../../../config/response-code.enum';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { MessageService } from '../../../core/message.service';
import { HTMLMetaData } from '../../../core/meta.interface';
import { MetaService } from '../../../core/meta.service';
import { PlatformService } from '../../../core/platform.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { format } from '../../../helpers/helper';
import md5 from '../../../helpers/md5';
import { OptionEntity } from '../../../interfaces/option.interface';
import { TenantAppModel } from '../../../interfaces/tenant-app.interface';
import { UserModel } from '../../../interfaces/user.interface';
import { OptionService } from '../../../services/option.service';
import { TenantAppService } from '../../../services/tenant-app.service';
import { Wallpaper } from '../../wallpaper/wallpaper.interface';
import { WallpaperService } from '../../wallpaper/wallpaper.service';
import { LoginResponse } from '../auth.interface';
import { AuthService } from '../auth.service';
import { UserComponent } from '../user.component';
import { USER_EMAIL_LENGTH, USER_PASSWORD_MAX_LENGTH } from '../user.constant';
import { UserService } from '../user.service';

const margin = 24;
const offsets = [margin, 0, -margin, 0];
const duration = 500; // ms

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less'],
  animations: [
    trigger('shakeForm', [
      state('normal', style({})),
      state('shaking', style({})),
      transition('* => shaking', [
        animate(
          duration,
          keyframes(offsets.concat(offsets, offsets).map((offset) => style({ marginLeft: `${offset}px` })))
        )
      ])
    ])
  ],
  providers: [DestroyService]
})
export class LoginComponent extends UserComponent implements OnInit, OnDestroy {
  readonly maxLoginLength = USER_EMAIL_LENGTH;
  readonly maxPasswordLength = USER_PASSWORD_MAX_LENGTH;

  isMobile = false;
  wallpaper: Wallpaper | null = null;
  loginForm = this.fb.group({
    username: [this.cookieService.get('user') || '', [Validators.required, Validators.maxLength(this.maxLoginLength)]],
    password: [null, [Validators.required, Validators.maxLength(this.maxPasswordLength)]]
  });
  passwordVisible = false;
  formStatus: 'normal' | 'shaking' = 'normal';
  loginLoading = false;
  pageLoaded = false;

  protected pageIndex = 'login';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private adminUrl = '';
  private referrer = '';

  constructor(
    @Inject(DOCUMENT) protected override document: Document,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private platform: PlatformService,
    private userAgentService: UserAgentService,
    private destroy$: DestroyService,
    private metaService: MetaService,
    private commonService: CommonService,
    private tenantAppService: TenantAppService,
    private optionService: OptionService,
    private cookieService: CookieService,
    private authService: AuthService,
    private message: MessageService,
    private wallpaperService: WallpaperService,
    private userService: UserService
  ) {
    super(document);
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updatePageOptions();
    this.updateActivePage();

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$, this.route.queryParamMap])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options, qp]) => {
        this.appInfo = appInfo;
        this.options = options;
        this.pageLoaded = true;

        this.updatePageInfo();
        this.initWallpaper();

        const ref = qp.get('ref')?.trim() || '';
        try {
          this.referrer = decodeURIComponent(ref);
        } catch (e) {
          this.referrer = ref;
        }

        this.adminUrl = this.appInfo.appAdminUrl;
        if (ref === 'logout') {
          this.authService.clearAuth();
        } else {
          // 登录状态直接跳转来源页或后台首页
          if (this.authService.isLoggedIn()) {
            if (this.platform.isBrowser) {
              const urlParam = format(
                ADMIN_URL_PARAM,
                this.authService.getToken(),
                this.authService.getExpiration(),
                APP_ID
              );
              location.href = this.referrer || this.adminUrl + urlParam;
            }
          }
        }
      });
  }

  ngOnDestroy() {
    this.clearStyles();
  }

  login() {
    const { value, valid } = this.validateForm(this.loginForm);
    if (!valid) {
      this.shakeForm();
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

        if (res.code === ResponseCode.SUCCESS && loginRes.accessToken) {
          const urlParam = format(ADMIN_URL_PARAM, loginRes.accessToken, loginRes.expiresAt, APP_ID);
          let redirectUrl: string;
          if (this.referrer && this.referrer !== 'logout') {
            if (/^https?:\/\//i.test(this.referrer)) {
              // 绝对路径
              redirectUrl = this.referrer;
            } else {
              // 相对路径
              redirectUrl = this.appInfo.appUrl + '/' + this.referrer.replace(/^\//i, '');
            }
          } else {
            redirectUrl = this.adminUrl + urlParam;
          }
          window.location.href = redirectUrl;
        } else if (res.code === ResponseCode.USER_UNVERIFIED) {
          const user: UserModel = res.data?.user || {};
          if (user.userId) {
            this.router.navigate(['../confirm'], {
              relativeTo: this.route,
              queryParams: {
                userId: user.userId
              }
            });
          }
        } else {
          this.shakeForm();
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
      ref: this.referrer,
      isMobile: this.isMobile
    });
    if (url) {
      location.href = url;
    }
  }

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.pageIndex);
  }

  protected updatePageOptions(): void {
    this.commonService.updatePageOptions({
      showHeader: true,
      showFooter: true,
      showMobileHeader: true,
      showMobileFooter: true
    });
  }

  private initWallpaper() {
    this.wallpaperService
      .getRandomWallpapers({
        size: 1,
        simple: true
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.wallpaper = res[0] || null;
        this.wallpaper && this.initStyles();
      });
  }

  private updatePageInfo() {
    const titles = ['登录', this.appInfo.appName];
    const keywords: string[] = this.appInfo.keywords;
    const metaData: HTMLMetaData = {
      title: titles.join(' - '),
      description: this.appInfo.appDescription,
      author: this.options['site_author'],
      keywords: uniq(keywords).join(',')
    };

    this.metaService.updateHTMLMeta(metaData);
  }

  private shakeForm() {
    this.formStatus = 'shaking';
    window.setTimeout(() => (this.formStatus = 'normal'), duration);
  }
}
