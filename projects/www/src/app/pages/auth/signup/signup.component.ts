import { Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  USER_EMAIL_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_PASSWORD_MIN_LENGTH,
  USER_PASSWORD_PATTERN
} from 'common/components';
import { AuthService, BaseComponent, BreadcrumbService, DestroyService, MetaService, OptionEntity } from 'common/core';
import { TenantAppVo } from 'common/interfaces';
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
  templateUrl: './signup.component.html'
})
export class SignupComponent extends BaseComponent implements OnInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly commonService = inject(CommonService);
  private readonly metaService = inject(MetaService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);
  private readonly authService = inject(AuthService);

  readonly maxEmailLength = USER_EMAIL_LENGTH;
  readonly minPasswordLength = USER_PASSWORD_MIN_LENGTH;
  readonly maxPasswordLength = USER_PASSWORD_MAX_LENGTH;

  readonly signupForm = this.fb.group({
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
  readonly signupLoading = signal(false);

  protected pageIndex = 'auth-signup';

  private readonly appInfo = signal<TenantAppVo | null>(null);
  private readonly options = signal<OptionEntity>({});

  ngOnInit(): void {
    this.updatePageIndex();
    this.updateBreadcrumbs();

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        this.appInfo.set(appInfo);
        this.options.set(options);

        this.updatePageInfo();
      });
  }

  signup() {
    const { value, valid } = this.validateForm(this.signupForm);
    if (!valid) {
      return;
    }
    const { email, password } = value;
    this.signupLoading.set(true);

    this.authService
      .signup({
        email,
        password: password,
        nickname: email.split('@')[0]
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.signupLoading.set(false);

        if (res.id) {
          this.router.navigate(['/user/confirm'], {
            relativeTo: this.route,
            queryParams: {
              userId: res.id
            }
          });
        }
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private updatePageInfo() {
    const appInfo = this.appInfo()!;

    this.metaService.updateHTMLMeta({
      title: ['注册', appInfo.name].join(' - '),
      description: appInfo.description,
      author: this.options()['site_author'],
      keywords: appInfo.keywords
    });
  }

  private updateBreadcrumbs() {
    this.breadcrumbService.updateBreadcrumbs([]);
  }
}
