import { Component, Inject, OnInit, Optional } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { REQUEST, RESPONSE } from '@nestjs/ng-universal/dist/tokens';
import { Request, Response } from 'express';
import { isEmpty, uniq } from 'lodash';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { ResponseCode } from '../../../config/response-code.enum';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { MessageService } from '../../../core/message.service';
import { HTMLMetaData } from '../../../core/meta.interface';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { PlatformService } from '../../../core/platform.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { OptionEntity } from '../../../interfaces/option.interface';
import { TenantAppModel } from '../../../interfaces/tenant-app.interface';
import { OptionService } from '../../../services/option.service';
import { TenantAppService } from '../../../services/tenant-app.service';
import { AuthService } from '../auth.service';
import { UserService } from '../user.service';

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

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private authCode = '';
  private appId = '';
  private scope = '';
  private source = '';
  private referrer = '';
  private errorCode = '';
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
    private tenantAppService: TenantAppService,
    private optionService: OptionService,
    private userService: UserService,
    private authService: AuthService,
    private message: MessageService
  ) {
    super();
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
        this.adminUrl = this.appInfo.appAdminUrl;

        const ref = qp.get('ref')?.trim() || '';
        try {
          this.referrer = decodeURIComponent(ref);
        } catch (e) {
          this.referrer = ref;
        }
        const loginParam = ref ? `?ref=${ref}` : '';
        this.loginURL = this.appInfo.appLoginUrl + loginParam;

        this.source = qp.get('from')?.trim() || '';
        if (this.source === 'alipay' || this.source === 'm_alipay') {
          this.authCode = qp.get('auth_code')?.trim() || '';
          this.appId = qp.get('app_id')?.trim() || '';
          this.scope = qp.get('scope')?.trim() || '';
        } else if (this.source === 'weibo') {
          this.authCode = qp.get('code')?.trim() || '';
          this.errorCode = qp.get('error_code')?.trim() || '';
        } else if (this.source === 'github') {
          this.authCode = qp.get('code')?.trim() || '';
          this.errorCode = qp.get('error')?.trim() || '';
        }

        this.updatePageInfo();
        this.thirdLogin();
      });
  }

  thirdLogin() {
    if (this.platform.isServer) {
      return;
    }
    if (this.source === 'weibo' && this.errorCode === '21330') {
      // cancel
      this.loginStatus = 'cancel';
      this.userService.gotoLogin(this.loginURL);
      return;
    }
    if (this.source === 'github' && this.errorCode === 'access_denied') {
      // cancel
      this.loginStatus = 'cancel';
      this.userService.gotoLogin(this.loginURL);
      return;
    }
    this.userService
      .thirdLogin(this.authCode, this.source)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.code === ResponseCode.SUCCESS) {
          this.loginStatus = 'success';
          this.authService.setAuth(res.data);
          const redirectUrl = this.referrer ? this.appInfo.appUrl + `?ref=${this.referrer}` : this.adminUrl;
          location.replace(redirectUrl);
        } else {
          this.message.error(res.message || '登录失败');
          this.loginStatus = 'failure';
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

  private startCountdown() {
    const timer = window.setInterval(() => {
      this.countdown -= 1;
      if (this.countdown <= 0) {
        clearInterval(timer);
        this.userService.gotoLogin(this.loginURL);
      }
    }, 1000);
  }
}
