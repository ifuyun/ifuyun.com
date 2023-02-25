import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { REQUEST, RESPONSE } from '@nestjs/ng-universal/dist/tokens';
import { Request, Response } from 'express';
import { isEmpty, uniq } from 'lodash';
import { CookieService } from 'ngx-cookie-service';
import { combineLatestWith, skipWhile, takeUntil } from 'rxjs';
import { MessageService } from '../../../components/message/message.service';
import { ADMIN_URL_PARAM } from '../../../config/common.constant';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { HTMLMetaData } from '../../../core/meta.interface';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { PlatformService } from '../../../core/platform.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { format, generateId } from '../../../helpers/helper';
import md5 from '../../../helpers/md5';
import { OptionEntity } from '../../../interfaces/option.interface';
import { AuthService } from '../../../services/auth.service';
import { OptionService } from '../../../services/option.service';
import { BING_DOMAIN } from '../../wallpaper/wallpaper.constant';
import { Wallpaper } from '../../wallpaper/wallpaper.interface';
import { WallpaperService } from '../../wallpaper/wallpaper.service';
import { THIRD_LOGIN_API, THIRD_LOGIN_CALLBACK } from '../login.constant';

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
export class LoginComponent extends PageComponent implements OnInit, OnDestroy {
  isMobile = false;
  loginForm = this.fb.group({
    username: [this.cookieService.get('user') || '', [Validators.required, Validators.maxLength(20)]],
    password: [null, [Validators.required, Validators.maxLength(20)]],
    rememberMe: [this.cookieService.get('remember') === '1']
  });
  autoFocus = {
    username: true,
    password: false
  };
  formStatus: 'normal' | 'shaking' = 'normal';
  wallpaper: Wallpaper | null = null;
  pageLoaded = false;

  protected pageIndex = 'login';

  private adminUrl = '';
  private options: OptionEntity = {};
  private referer = '';

  constructor(
    @Optional() @Inject(RESPONSE) private response: Response,
    @Optional() @Inject(REQUEST) private request: Request,
    @Inject(DOCUMENT) private document: Document,
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
    super();
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

        const ref = queryParams.get('ref')?.trim() || '';
        try {
          this.referer = decodeURIComponent(ref);
        } catch (e) {
          this.referer = ref;
        }

        this.adminUrl = this.options['admin_site_url'];
        const rememberMe = this.cookieService.get('remember');
        // 登录状态直接跳转来源页或后台首页
        if (rememberMe === '1' && this.authService.isLoggedIn()) {
          if (this.platform.isBrowser) {
            const urlParam = format(ADMIN_URL_PARAM, this.authService.getToken(), this.authService.getExpiration());
            location.href = this.referer || this.adminUrl + urlParam;
          }
        }
      });
    const username = this.cookieService.get('user');
    if (username) {
      this.autoFocus.username = false;
      this.autoFocus.password = true;
    }
    this.fetchWallpaper();
  }

  ngOnDestroy() {
    this.clearStyles();
  }

  login() {
    const { value, valid } = this.validateForm(this.loginForm);
    if (valid) {
      const { username, password, rememberMe } = value;
      this.authService
        .login({
          username: username || '',
          password: md5(password || ''),
          rememberMe: rememberMe || false
        })
        .subscribe((res) => {
          if (res.accessToken) {
            const urlParam = format(ADMIN_URL_PARAM, res.accessToken, res.expiresAt);
            window.location.href = this.referer ? this.options['site_url'] + this.referer : this.adminUrl + urlParam;
          } else {
            this.shakeForm();
          }
        });
    } else {
      this.shakeForm();

      const formLabels: Record<string, string> = {
        username: '用户名',
        password: '密码'
      };
      const msgs: string[] = [];
      Object.keys(this.loginForm.controls).forEach((key) => {
        const ctrl = this.loginForm.get(key);
        const errors = ctrl?.errors;
        if (errors) {
          Object.keys(errors).forEach((type) => {
            switch (type) {
              case 'required':
                msgs.push(`请输入${formLabels[key]}`);
                break;
              case 'maxlength':
                msgs.push(
                  `${formLabels[key]}长度应不大于${errors[type].requiredLength}字符，当前为${errors[type].actualLength}`
                );
                break;
            }
          });
        }
      });
      msgs.length > 0 && this.message.error(msgs[0]);
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

  private fetchWallpaper() {
    this.wallpaperService
      .getRandomWallpapers(1)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.wallpaper =
          res.map((item) => ({
            ...item,
            url: `${BING_DOMAIN}${item.url}`
          }))[0] || null;
        if (this.wallpaper) {
          this.initStyles();
        }
      });
  }

  private getCallbackURL(channel: string) {
    return this.commonService.getURL(this.options, format(THIRD_LOGIN_CALLBACK, channel, this.referer));
  }

  private initStyles() {
    this.document.body.classList.add('bg-image');
    this.document.body.style.backgroundImage = `url('${this.wallpaper?.url}')`;
  }

  private clearStyles() {
    this.document.body.classList.remove('bg-image');
    this.document.body.style.backgroundImage = '';
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
    setTimeout(() => (this.formStatus = 'normal'), duration);
  }
}
