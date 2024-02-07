import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { CookieService } from 'ngx-cookie-service';
import { combineLatestWith, skipWhile, takeUntil } from 'rxjs';
import { ADMIN_URL_PARAM, APP_ID } from '../../../config/common.constant';
import { ResponseCode } from '../../../config/response-code.enum';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { MessageService } from '../../../core/message.service';
import { HTMLMetaData } from '../../../core/meta.interface';
import { MetaService } from '../../../core/meta.service';
import { PlatformService } from '../../../core/platform.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { format, generateId } from '../../../helpers/helper';
import md5 from '../../../helpers/md5';
import { OptionEntity } from '../../../interfaces/option.interface';
import { UserModel } from '../../../interfaces/user.interface';
import { OptionService } from '../../../services/option.service';
import { Wallpaper } from '../../wallpaper/wallpaper.interface';
import { WallpaperService } from '../../wallpaper/wallpaper.service';
import { LoginResponse } from '../auth.interface';
import { AuthService } from '../auth.service';
import { UserComponent } from '../user.component';
import { THIRD_LOGIN_API, THIRD_LOGIN_CALLBACK, USER_EMAIL_LENGTH, USER_PASSWORD_LENGTH } from '../user.constant';

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
  readonly maxPasswordLength = USER_PASSWORD_LENGTH;

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

  private options: OptionEntity = {};
  private adminUrl = '';
  private referer = '';

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
    private optionService: OptionService,
    private cookieService: CookieService,
    private authService: AuthService,
    private message: MessageService,
    private wallpaperService: WallpaperService
  ) {
    super(document);
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updatePageOptions();
    this.updateActivePage();
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        combineLatestWith(this.route.queryParamMap),
        takeUntil(this.destroy$)
      )
      .subscribe(([options, queryParams]) => {
        this.options = options;
        this.pageLoaded = true;

        this.updatePageInfo();
        this.initWallpaper();

        const ref = queryParams.get('ref')?.trim() || '';
        try {
          this.referer = decodeURIComponent(ref);
        } catch (e) {
          this.referer = ref;
        }

        this.adminUrl = this.options['admin_url'];
        if (ref === 'logout') {
          this.authService.clearAuth();
        } else {
          // 登录状态直接跳转来源页或后台首页
          if (this.authService.isLoggedIn()) {
            if (this.platform.isBrowser) {
              const urlParam = format(ADMIN_URL_PARAM, this.authService.getToken(), this.authService.getExpiration());
              location.href = this.referer || this.adminUrl + urlParam;
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
    if (valid) {
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
            const urlParam = format(ADMIN_URL_PARAM, loginRes.accessToken, loginRes.expiresAt);
            let redirectUrl: string;
            if (this.referer && this.referer !== 'logout') {
              redirectUrl = this.options['site_url'] + `?ref=${this.referer}`;
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
    } else {
      this.shakeForm();
    }
  }

  getUser(type: string): void {
    if (!['alipay', 'weibo', 'github'].includes(type)) {
      this.message.warning('Sorry, we are stepping up our efforts to launch this feature, please wait...');
      return;
    }
    if (isEmpty(this.options)) {
      return;
    }
    let url = '';
    switch (type) {
      case 'alipay':
        if (this.isMobile) {
          const authUrl = format(
            THIRD_LOGIN_API[type],
            this.options['open_alipay_app_id'],
            encodeURIComponent(this.getCallbackURL('m_alipay')),
            generateId()
          );
          url = `alipays://platformapi/startapp?appId=20000067&url=${encodeURIComponent(authUrl)}`;
        } else {
          url = format(
            THIRD_LOGIN_API[type],
            this.options['open_alipay_app_id'],
            encodeURIComponent(this.getCallbackURL('alipay')),
            generateId()
          );
        }
        break;
      case 'weibo':
        url = format(
          THIRD_LOGIN_API[type],
          this.options['open_weibo_app_key'],
          encodeURIComponent(this.getCallbackURL('weibo'))
        );
        break;
      case 'github':
        url = format(
          THIRD_LOGIN_API[type],
          this.options['open_github_client_id'],
          encodeURIComponent(this.getCallbackURL('github')),
          generateId()
        );
    }
    location.href = url;
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

  private getCallbackURL(channel: string) {
    return this.commonService.getURL(this.options, format(THIRD_LOGIN_CALLBACK, channel, this.referer));
  }

  private updatePageInfo() {
    const titles = ['登录', this.options['site_name']];
    const keywords: string[] = (this.options['site_keywords'] || '').split(',');
    const metaData: HTMLMetaData = {
      title: titles.join(' - '),
      description: this.options['site_description'],
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
