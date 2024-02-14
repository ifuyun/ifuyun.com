import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { ADMIN_URL_PARAM, APP_ID } from '../../../config/common.constant';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { MessageService } from '../../../core/message.service';
import { HTMLMetaData } from '../../../core/meta.interface';
import { MetaService } from '../../../core/meta.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { format } from '../../../helpers/helper';
import { OptionEntity } from '../../../interfaces/option.interface';
import { TenantAppModel } from '../../../interfaces/tenant-app.interface';
import { UserModel } from '../../../interfaces/user.interface';
import { OptionService } from '../../../services/option.service';
import { TenantAppService } from '../../../services/tenant-app.service';
import { Wallpaper } from '../../wallpaper/wallpaper.interface';
import { WallpaperService } from '../../wallpaper/wallpaper.service';
import { AuthService } from '../auth.service';
import { UserComponent } from '../user.component';
import { UserStatus } from '../user.enum';
import { UserService } from '../user.service';

@Component({
  selector: 'app-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['../login/login.component.less'],
  providers: [DestroyService]
})
export class ConfirmComponent extends UserComponent implements OnInit, OnDestroy {
  isMobile = false;
  wallpaper: Wallpaper | null = null;
  confirmForm = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\s*\d{4}\s*$/i)]]
  });
  confirmLoading = false;
  user?: UserModel;
  countdown = 0; // 60s

  protected pageIndex = 'register';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private userId = '';
  private referer = '';
  private adminUrl = '';

  constructor(
    @Inject(DOCUMENT) protected override document: Document,
    private destroy$: DestroyService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private userAgentService: UserAgentService,
    private metaService: MetaService,
    private commonService: CommonService,
    private message: MessageService,
    private tenantAppService: TenantAppService,
    private optionService: OptionService,
    private userService: UserService,
    private authService: AuthService,
    private wallpaperService: WallpaperService
  ) {
    super(document);
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit() {
    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$, this.route.queryParamMap])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options, qp]) => {
        this.appInfo = appInfo;
        this.options = options;
        this.adminUrl = this.appInfo.appAdminUrl;

        this.updatePageInfo();
        this.initWallpaper();

        const ref = qp.get('ref')?.trim() || '';
        try {
          this.referer = decodeURIComponent(ref);
        } catch (e) {
          this.referer = ref;
        }
        this.userId = qp.get('userId') || '';

        this.fetchUser();
      });
  }

  ngOnDestroy() {
    this.clearStyles();
  }

  verify() {
    if (this.confirmLoading) {
      return;
    }
    const { value, valid } = this.validateForm(this.confirmForm);
    if (valid) {
      const { code } = value;
      this.confirmLoading = true;
      this.authService
        .verify({
          userId: this.userId,
          code
        })
        .subscribe((res) => {
          this.confirmLoading = false;
          if (res.accessToken) {
            const urlParam = format(ADMIN_URL_PARAM, res.accessToken, res.expiresAt, APP_ID);
            let redirectUrl: string;
            if (this.referer && this.referer !== 'logout') {
              redirectUrl = this.appInfo.appUrl + this.referer;
            } else {
              redirectUrl = this.adminUrl + urlParam;
            }
            window.location.href = redirectUrl;
          }
        });
    }
  }

  resendCode() {
    this.countdown = 60;
    this.startCountdown();
    this.authService
      .resend(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.userId) {
          this.message.success('验证码已重新发送');
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

  private fetchUser() {
    this.userService
      .getRegisterUser(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.user = res;
        if (res.userStatus === UserStatus.NORMAL) {
          this.message.info('账号已验证，无需重复验证');
          this.router.navigate(['/user/login']);
        }
      });
  }

  private startCountdown() {
    const timer = window.setInterval(() => {
      this.countdown -= 1;
      if (this.countdown <= 0) {
        clearInterval(timer);
      }
    }, 1000);
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
    const titles = ['注册验证', this.appInfo.appName];
    const keywords: string[] = this.appInfo.keywords;
    const metaData: HTMLMetaData = {
      title: titles.join(' - '),
      description: this.appInfo.appDescription,
      author: this.options['site_author'],
      keywords: uniq(keywords).join(',')
    };
    this.metaService.updateHTMLMeta(metaData);
  }
}
