import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { NzMessageService } from 'ng-zorro-antd/message';
import { combineLatestWith, Observer, skipWhile, takeUntil } from 'rxjs';
import { ADMIN_URL_PARAM } from '../../../config/common.constant';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { HTMLMetaData } from '../../../core/meta.interface';
import { MetaService } from '../../../core/meta.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { format } from '../../../helpers/helper';
import { OptionEntity } from '../../../interfaces/option.interface';
import { OptionService } from '../../../services/option.service';
import { Wallpaper } from '../../wallpaper/wallpaper.interface';
import { WallpaperService } from '../../wallpaper/wallpaper.service';
import { AuthService } from '../auth.service';
import { UserComponent } from '../user.component';

@Component({
  selector: 'app-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['../login/login.component.less'],
  providers: [DestroyService]
})
export class ConfirmComponent extends UserComponent implements OnInit, OnDestroy {
  isMobile = false;
  wallpaper: Wallpaper | null = null;
  confirmForm = this.fb.group(
    {
      code: ['', [Validators.required, Validators.pattern(/^\s*\d{4}\s*$/i)]]
    }
  );
  confirmLoading = false;
  userEmail = '';
  countdown = 0; // 60s

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
    private message: NzMessageService,
    private optionService: OptionService,
    private authService: AuthService
  ) {
    super(document, wallpaperService);
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit() {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((queryParams) => {
      this.userId = queryParams.get('userId') || '';
      this.userEmail = queryParams.get('email') || '';
    });
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        combineLatestWith(this.route.queryParamMap),
        takeUntil(this.destroy$)
      )
      .subscribe(<Observer<[OptionEntity, ParamMap]>>{
        next: ([options, queryParams]) => {
          this.options = options;
          this.updatePageInfo();

          const ref = queryParams.get('ref')?.trim() || '';
          try {
            this.referer = decodeURIComponent(ref);
          } catch (e) {
            this.referer = ref;
          }
          this.userId = queryParams.get('userId') || '';
          this.userEmail = queryParams.get('email') || '';
          this.adminUrl = this.options['admin_site_url'];
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
    this.authService.resend(this.userId).pipe(takeUntil(this.destroy$)).subscribe((res) => {
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

  private startCountdown() {
    const timer = setInterval(() => {
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
        this.wallpaper = this.transformWallpaper(res)[0] || null;
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
