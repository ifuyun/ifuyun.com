import { Component, Inject, OnInit, Optional } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { REQUEST, RESPONSE } from '@nestjs/ng-universal/dist/tokens';
import { Request, Response } from 'express';
import { isEmpty, uniq } from 'lodash';
import { combineLatestWith, skipWhile } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { MessageService } from '../../../components/message/message.service';
import { ADMIN_URL, LOGIN_URL } from '../../../config/common.constant';
import { Message } from '../../../config/message.enum';
import { ResponseCode } from '../../../config/response-code.enum';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { HTMLMetaData } from '../../../core/meta.interface';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { PlatformService } from '../../../core/platform.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { OptionEntity } from '../../../interfaces/option.interface';
import { AuthService } from '../../../services/auth.service';
import { OptionService } from '../../../services/option.service';
import { UserService } from '../../../services/user.service';
import { LoginService } from '../login.service';

@Component({
  selector: 'app-third-login',
  templateUrl: './third-login.component.html',
  styleUrls: ['./third-login.component.less'],
  providers: [DestroyService]
})
export class ThirdLoginComponent extends PageComponent implements OnInit {
  isMobile = false;
  loginStatus: 'loading' | 'success' | 'cancel' | 'failure' = 'loading';
  loginURL = '';
  countdown = 3; // 3s

  protected pageIndex = 'login';

  private options: OptionEntity = {};
  private authCode = '';
  private appId = '';
  private scope = '';
  private from = '';
  private referer = '';
  private errCode = '';
  private adminUrl = '';

  constructor(
    @Optional() @Inject(RESPONSE) private response: Response,
    @Optional() @Inject(REQUEST) private request: Request,
    private route: ActivatedRoute,
    private platform: PlatformService,
    private userAgentService: UserAgentService,
    private destroy$: DestroyService,
    private metaService: MetaService,
    private commonService: CommonService,
    private optionService: OptionService,
    private userService: UserService,
    private authService: AuthService,
    private loginService: LoginService,
    private message: MessageService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updatePageOptions();
    this.updateActivePage();
    this.route.queryParamMap
      .pipe(
        takeUntil(this.destroy$),
        combineLatestWith(this.optionService.options$),
        skipWhile(([, options]) => isEmpty(options)),
        tap(([params, options]) => {
          this.options = options;
          this.adminUrl = `${this.options['site_url']}${ADMIN_URL}`;

          const ref = params.get('ref')?.trim() || '';
          try {
            this.referer = decodeURIComponent(ref);
          } catch (e) {
            this.referer = ref;
          }
          const loginParam = ref ? `?ref=${ref}` : '';
          this.loginURL = this.commonService.getURL(options, LOGIN_URL) + loginParam;

          this.from = params.get('from')?.trim() || '';
          if (this.from === 'alipay' || this.from === 'm_alipay') {
            this.authCode = params.get('auth_code')?.trim() || '';
            this.appId = params.get('app_id')?.trim() || '';
            this.scope = params.get('scope')?.trim() || '';
          } else if (this.from === 'weibo') {
            this.authCode = params.get('code')?.trim() || '';
            this.errCode = params.get('error_code')?.trim() || '';
          } else if (this.from === 'github') {
            this.authCode = params.get('code')?.trim() || '';
            this.errCode = params.get('error')?.trim() || '';
          }
        })
      )
      .subscribe(() => {
        this.updatePageInfo();
        this.thirdLogin();
      });
  }

  thirdLogin() {
    if (this.platform.isServer) {
      return;
    }
    if (this.from === 'weibo' && this.errCode === '21330') {
      // cancel
      this.loginStatus = 'cancel';
      this.loginService.gotoLogin(this.loginURL);
      return;
    }
    if (this.from === 'github' && this.errCode === 'access_denied') {
      // cancel
      this.loginStatus = 'cancel';
      this.loginService.gotoLogin(this.loginURL);
      return;
    }
    this.userService.getThirdUser(this.authCode, this.from)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.code === ResponseCode.SUCCESS) {
          this.loginStatus = 'success';
          this.authService.setAuth(res.data, { username: '', password: '', rememberMe: false });
          const redirectUrl = this.referer ? this.options['site_url'] + this.referer : this.adminUrl;
          location.replace(redirectUrl);
        } else {
          this.loginStatus = 'failure';
          this.message.error(Message.LOGIN_ERROR);
          this.startCountdown();
        }
      });
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

  private startCountdown() {
    const timer = setInterval(() => {
      this.countdown -= 1;
      if (this.countdown <= 0) {
        clearInterval(timer);
        this.loginService.gotoLogin(this.loginURL);
      }
    }, 1000);
  }
}
