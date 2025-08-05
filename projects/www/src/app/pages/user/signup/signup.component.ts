import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  USER_EMAIL_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_PASSWORD_MIN_LENGTH,
  USER_PASSWORD_PATTERN
} from 'common/components';
import { AuthService, BaseComponent, BreadcrumbService, DestroyService, MetaService, OptionEntity } from 'common/core';
import { TenantAppModel } from 'common/interfaces';
import { CommonService, OptionService, TenantAppService } from 'common/services';
import { isEmpty } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, NzFormModule, NzInputModule, NzButtonModule, NzIconModule],
  providers: [DestroyService],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.less'
})
export class SignupComponent extends BaseComponent implements OnInit {
  readonly maxEmailLength = USER_EMAIL_LENGTH;
  readonly minPasswordLength = USER_PASSWORD_MIN_LENGTH;
  readonly maxPasswordLength = USER_PASSWORD_MAX_LENGTH;

  signupForm!: FormGroup;
  passwordVisible = false;
  signupLoading = false;

  protected pageIndex = 'auth-signup';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};

  constructor(
    private readonly destroy$: DestroyService,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly authService: AuthService
  ) {
    super();
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
    this.updatePageIndex();
    this.updateBreadcrumbs();

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        this.appInfo = appInfo;
        this.options = options;

        this.updatePageInfo();
      });
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
        userPassword: password,
        userNickname: email.split('@')[0]
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.signupLoading = false;
        if (res.userId) {
          this.router.navigate(['/user/confirm'], {
            relativeTo: this.route,
            queryParams: {
              userId: res.userId
            }
          });
        }
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private updatePageInfo() {
    this.metaService.updateHTMLMeta({
      title: ['注册', this.appInfo.appName].join(' - '),
      description: this.appInfo.appDescription,
      author: this.options['site_author'],
      keywords: this.appInfo.appKeywords
    });
  }

  private updateBreadcrumbs() {
    this.breadcrumbService.updateBreadcrumbs([]);
  }
}
