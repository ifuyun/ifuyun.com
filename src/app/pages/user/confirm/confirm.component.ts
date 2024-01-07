import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { combineLatestWith, Observer, skipWhile, takeUntil } from 'rxjs';
import { ADMIN_URL_PARAM } from '../../../config/common.constant';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { MessageService } from '../../../core/message.service';
import { HTMLMetaData } from '../../../core/meta.interface';
import { MetaService } from '../../../core/meta.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { format } from '../../../helpers/helper';
import { OptionEntity } from '../../../interfaces/option.interface';
import { UserModel } from '../../../interfaces/user.interface';
import { OptionService } from '../../../services/option.service';
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
  isLoggedIn = false;

  protected pageIndex = 'register';

  private options: OptionEntity = {};
  private userId = '';
  private referer = '';
  private adminUrl = '';

  constructor(
    @Inject(DOCUMENT) protected override document: Document,
    protected override wallpaperService: WallpaperService,
    private destroy$: DestroyService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private userAgentService: UserAgentService,
    private metaService: MetaService,
    private commonService: CommonService,
    private message: MessageService,
    private optionService: OptionService,
    private userService: UserService,
    private authService: AuthService
  ) {
    super(document, wallpaperService);
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit() {
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        combineLatestWith(this.route.queryParamMap, this.userService.loginUser$),
        takeUntil(this.destroy$)
      )
      .subscribe(<Observer<[OptionEntity, ParamMap, UserModel]>>{
        next: ([options, queryParams, loginUser]) => {
          this.options = options;
          this.adminUrl = this.options['admin_url'];
          this.isLoggedIn = !!loginUser.userId;
          this.updatePageInfo();

          const ref = queryParams.get('ref')?.trim() || '';
          try {
            this.referer = decodeURIComponent(ref);
          } catch (e) {
            this.referer = ref;
          }
          this.userId = queryParams.get('userId') || '';

          this.fetchUser();
        }
      });
    this.initWallpaper();
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
            const urlParam = format(ADMIN_URL_PARAM, res.accessToken, res.expiresAt);
            let redirectUrl: string;
            if (this.referer && this.referer !== 'logout') {
              redirectUrl = this.options['site_url'] + this.referer;
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
          if (this.isLoggedIn) {
            this.router.navigate(['/']);
          } else {
            this.router.navigate(['/user/login']);
          }
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
    this.fetchWallpaper()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.wallpaper = this.transformWallpaper(res, this.options['wallpaper_server'])[0] || null;
        this.wallpaper && this.initStyles();
      });
  }

  private updatePageInfo() {
    const titles = ['注册验证', this.options['site_name']];
    const keywords: string[] = (this.options['site_keywords'] || '').split(',');
    const metaData: HTMLMetaData = {
      title: titles.join(' - '),
      description: this.options['site_description'],
      author: this.options['site_author'],
      keywords: uniq(keywords).join(',')
    };
    this.metaService.updateHTMLMeta(metaData);
  }
}
