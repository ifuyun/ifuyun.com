import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { combineLatestWith, Observer, skipWhile, takeUntil } from 'rxjs';
import { APP_ID } from '../../../config/common.constant';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { MessageService } from '../../../core/message.service';
import { HTMLMetaData } from '../../../core/meta.interface';
import { MetaService } from '../../../core/meta.service';
import { UserAgentService } from '../../../core/user-agent.service';
import md5 from '../../../helpers/md5';
import { OptionEntity } from '../../../interfaces/option.interface';
import { OptionService } from '../../../services/option.service';
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
  regForm = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email, Validators.maxLength(this.maxEmailLength)]],
      password: [null, [Validators.required, Validators.maxLength(this.maxPasswordLength)]],
      confirmPassword: [null, [Validators.required, Validators.maxLength(this.maxPasswordLength)]]
    },
    {
      validators: [
        (control: AbstractControl): ValidationErrors | null => {
          const password = control.get('password')?.value;
          const confirmPassword = control.get('confirmPassword')?.value;
          const result: ValidationErrors = { confirmPassword: {} };
          if (!confirmPassword) {
            result['confirmPassword'].required = true;
            return result;
          }
          if (confirmPassword.length > this.maxPasswordLength) {
            result['confirmPassword'].maxlength = true;
            return result;
          }
          if (confirmPassword !== password) {
            result['confirmPassword'].invalid = true;
            return result;
          }
          return null;
        }
      ]
    }
  );
  passwordVisible = {
    password: false,
    confirmPassword: false
  };
  regLoading = false;

  protected pageIndex = 'register';

  private options: OptionEntity = {};

  constructor(
    @Inject(DOCUMENT) protected override document: Document,
    protected override wallpaperService: WallpaperService,
    private destroy$: DestroyService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private userAgentService: UserAgentService,
    private metaService: MetaService,
    private commonService: CommonService,
    private optionService: OptionService,
    private authService: AuthService,
    private message: MessageService
  ) {
    super(document, wallpaperService);
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
      .subscribe(<Observer<[OptionEntity, ParamMap]>>{
        next: ([options]) => {
          this.options = options;
          this.updatePageInfo();
        }
      });
    this.initWallpaper();
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
    this.fetchWallpaper()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.wallpaper = this.transformWallpaper(res)[0] || null;
        this.wallpaper && this.initStyles();
      });
  }

  private updatePageInfo() {
    const titles = ['注册', this.options['site_name']];
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
