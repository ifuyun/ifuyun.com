import { NgIf } from '@angular/common';
import { HttpStatusCode } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { isEmpty } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BaseComponent } from '../../../base.component';
import { ADMIN_URL_PARAM, APP_ID } from '../../../config/common.constant';
import { Message } from '../../../config/message.enum';
import { UserStatus } from '../../../enums/user';
import { CustomError } from '../../../interfaces/custom-error';
import { OptionEntity } from '../../../interfaces/option';
import { TenantAppModel } from '../../../interfaces/tenant-app';
import { UserModel } from '../../../interfaces/user';
import { AuthService } from '../../../services/auth.service';
import { BreadcrumbService } from '../../../services/breadcrumb.service';
import { CommonService } from '../../../services/common.service';
import { DestroyService } from '../../../services/destroy.service';
import { MetaService } from '../../../services/meta.service';
import { OptionService } from '../../../services/option.service';
import { PlatformService } from '../../../services/platform.service';
import { TenantAppService } from '../../../services/tenant-app.service';
import { UserService } from '../../../services/user.service';
import { format } from '../../../utils/helper';

@Component({
  selector: 'app-signup-confirm',
  imports: [NgIf, ReactiveFormsModule, NzFormModule, NzInputModule, NzButtonModule],
  providers: [DestroyService],
  templateUrl: './signup-confirm.component.html',
  styleUrl: './signup-confirm.component.less'
})
export class SignupConfirmComponent extends BaseComponent implements OnInit, OnDestroy {
  confirmForm!: FormGroup;
  confirmLoading = false;
  user?: UserModel;
  countdown = 60; // 60s

  protected pageIndex = 'auth-signup';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private userId = '';
  private sendTimer!: number;

  constructor(
    private readonly destroy$: DestroyService,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly platform: PlatformService,
    private readonly message: NzMessageService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {
    super();
    this.confirmForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\s*\d{4}\s*$/i)]]
    });
  }

  ngOnInit(): void {
    this.updatePageIndex();
    this.updateBreadcrumbs();

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$, this.route.queryParamMap])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options, qp]) => {
        this.appInfo = appInfo;
        this.options = options;
        this.userId = qp.get('userId') || '';

        if (!this.userId) {
          throw new CustomError(Message.USER_NOT_FOUND, HttpStatusCode.BadRequest);
        }

        this.updatePageInfo();
        this.getSignupUser();
        if (this.platform.isBrowser) {
          this.startCountdown();
        }
      });
  }

  ngOnDestroy() {
    if (this.sendTimer) {
      window.clearInterval(this.sendTimer);
    }
  }

  verify() {
    const { value, valid } = this.validateForm(this.confirmForm);
    if (!valid) {
      return;
    }
    const { code } = value;
    this.confirmLoading = true;
    this.authService
      .verify(this.userId, code)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.confirmLoading = false;

        if (res.token?.accessToken) {
          const urlParam = format(ADMIN_URL_PARAM, res.token.accessToken, APP_ID);
          window.location.href = this.appInfo.appAdminUrl + '?' + urlParam;
        }
      });
  }

  resendCode() {
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

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getSignupUser() {
    this.userService
      .getSignupUser(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.user = res;

        if (res.userStatus === UserStatus.NORMAL) {
          this.message.info('账号已验证，无需重复验证');
          this.router.navigate(['../login'], {
            relativeTo: this.route
          });
        }
      });
  }

  private startCountdown() {
    this.countdown = 60;
    this.sendTimer = window.setInterval(() => {
      this.countdown -= 1;
      if (this.countdown <= 0) {
        window.clearInterval(this.sendTimer);
      }
    }, 1000);
  }

  private updatePageInfo() {
    this.metaService.updateHTMLMeta({
      title: ['注册验证', this.appInfo.appName].join(' - '),
      description: this.appInfo.appDescription,
      author: this.options['site_author'],
      keywords: this.appInfo.appKeywords
    });
  }

  private updateBreadcrumbs() {
    this.breadcrumbService.updateBreadcrumbs([]);
  }
}
