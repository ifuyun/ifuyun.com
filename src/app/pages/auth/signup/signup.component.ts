import { DOCUMENT, NgIf } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import {
  USER_EMAIL_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_PASSWORD_MIN_LENGTH,
  USER_PASSWORD_PATTERN
} from '../../../config/auth.constant';
import { OptionEntity } from '../../../interfaces/option';
import { TenantAppModel } from '../../../interfaces/tenant-app';
import { Wallpaper } from '../../../interfaces/wallpaper';
import { AuthService } from '../../../services/auth.service';
import { BreadcrumbService } from '../../../services/breadcrumb.service';
import { CommonService } from '../../../services/common.service';
import { DestroyService } from '../../../services/destroy.service';
import { MetaService } from '../../../services/meta.service';
import { OptionService } from '../../../services/option.service';
import { PlatformService } from '../../../services/platform.service';
import { TenantAppService } from '../../../services/tenant-app.service';
import { WallpaperService } from '../../../services/wallpaper.service';
import md5 from '../../../utils/md5';
import { AuthComponent } from '../auth.component';

@Component({
  selector: 'app-signup',
  imports: [NgIf, ReactiveFormsModule, NzFormModule, NzInputModule, NzButtonModule, NzIconModule],
  providers: [DestroyService],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.less'
})
export class SignupComponent extends AuthComponent implements OnInit, OnDestroy {
  readonly maxEmailLength = USER_EMAIL_LENGTH;
  readonly minPasswordLength = USER_PASSWORD_MIN_LENGTH;
  readonly maxPasswordLength = USER_PASSWORD_MAX_LENGTH;

  wallpaper: Wallpaper | null = null;
  signupForm!: FormGroup;
  passwordVisible = false;
  signupLoading = false;

  protected activePage = 'signup';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};

  constructor(
    @Inject(DOCUMENT) protected override document: Document,
    private readonly destroy$: DestroyService,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly platform: PlatformService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly authService: AuthService,
    private readonly wallpaperService: WallpaperService
  ) {
    super(document);
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.maxLength(this.maxEmailLength)]],
      password: [
        null,
        [
          (control: AbstractControl): ValidationErrors | null => {
            const password = control.value;

            if (!password) {
              return { required: true };
            }
            if (!USER_PASSWORD_PATTERN.test(password)) {
              return { pattern: true };
            }
            if (password.length < this.minPasswordLength) {
              return { minlength: true };
            }
            if (password.length > this.maxPasswordLength) {
              return { maxlength: true };
            }
            return null;
          }
        ]
      ]
    });
  }

  ngOnInit(): void {
    this.updateActivePage();
    this.updateBreadcrumb();

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        this.appInfo = appInfo;
        this.options = options;

        if (this.platform.isServer) {
          this.updatePageInfo();
          this.getWallpaper();
        }
      });
  }

  ngOnDestroy() {
    this.clearStyles();
  }

  signup() {
    const { value, valid } = this.validateForm(this.signupForm);
    if (!valid) {
      return;
    }
    const { email, password } = value;
    this.signupLoading = true;
    this.authService
      .signup({
        userEmail: email,
        userPassword: md5(password),
        userNickname: email.split('@')[0]
      })
      .subscribe((res) => {
        this.signupLoading = false;
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

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.activePage);
  }

  private getWallpaper() {
    this.wallpaperService
      .getRandomWallpapers(1, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.wallpaper = res[0] || null;
        if (this.wallpaper) {
          this.initStyles();
        }
      });
  }

  private updatePageInfo() {
    this.metaService.updateHTMLMeta({
      title: ['注册', this.appInfo.appName].join(' - '),
      description: this.appInfo.appDescription,
      author: this.options['site_author'],
      keywords: uniq(this.appInfo.keywords).join(',')
    });
  }

  private updateBreadcrumb() {
    this.breadcrumbService.updateBreadcrumbs([]);
  }
}
