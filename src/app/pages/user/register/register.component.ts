import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { APP_ID } from '../../../config/common.constant';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { HTMLMetaData } from '../../../core/meta.interface';
import { MetaService } from '../../../core/meta.service';
import { UserAgentService } from '../../../core/user-agent.service';
import md5 from '../../../helpers/md5';
import { OptionEntity } from '../../../interfaces/option.interface';
import { TenantAppModel } from '../../../interfaces/tenant-app.interface';
import { OptionService } from '../../../services/option.service';
import { TenantAppService } from '../../../services/tenant-app.service';
import { Wallpaper } from '../../wallpaper/wallpaper.interface';
import { WallpaperService } from '../../wallpaper/wallpaper.service';
import { AuthService } from '../auth.service';
import { UserComponent } from '../user.component';
import { USER_EMAIL_LENGTH, USER_PASSWORD_LENGTH } from '../user.constant';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['../login/login.component.less'],
  providers: [DestroyService]
})
export class RegisterComponent extends UserComponent implements OnInit, OnDestroy {
  readonly maxEmailLength = USER_EMAIL_LENGTH;
  readonly maxPasswordLength = USER_PASSWORD_LENGTH;

  isMobile = false;
  wallpaper: Wallpaper | null = null;
  regForm = this.fb.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(this.maxEmailLength)]],
    password: [null, [Validators.required, Validators.maxLength(this.maxPasswordLength)]]
  });
  passwordVisible = false;
  regLoading = false;

  protected pageIndex = 'register';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};

  constructor(
    @Inject(DOCUMENT) protected override document: Document,
    private destroy$: DestroyService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private userAgentService: UserAgentService,
    private metaService: MetaService,
    private commonService: CommonService,
    private tenantAppService: TenantAppService,
    private optionService: OptionService,
    private authService: AuthService,
    private wallpaperService: WallpaperService
  ) {
    super(document);
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updatePageOptions();
    this.updateActivePage();

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        this.appInfo = appInfo;
        this.options = options;

        this.updatePageInfo();
        this.initWallpaper();
      });
  }

  ngOnDestroy() {
    this.clearStyles();
  }

  register() {
    const { value, valid } = this.validateForm(this.regForm);
    if (valid) {
      const { email, password } = value;
      this.regLoading = true;
      this.authService
        .register({
          userEmail: email,
          userPassword: md5(password),
          userNiceName: email.split('@')[0],
          appId: APP_ID
        })
        .subscribe((res) => {
          this.regLoading = false;
          if (res.userId) {
            this.router.navigate(['../confirm'], {
              relativeTo: this.route,
              queryParams: {
                userId: res.userId
              }
            });
          }
        });
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
    const titles = ['注册', this.appInfo.appName];
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
