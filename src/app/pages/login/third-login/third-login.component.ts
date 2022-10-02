import { Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { REQUEST, RESPONSE } from '@nguniversal/express-engine/tokens';
import { Request, Response } from 'express';
import { combineLatestWith, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ADMIN_URL } from '../../../config/constants';
import { ResponseCode } from '../../../config/response-code.enum';
import { PlatformService } from '../../../core/platform.service';
import { OptionEntity } from '../../../interfaces/option.interface';
import { AuthService } from '../../../services/auth.service';
import { OptionService } from '../../../services/option.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-third-login',
  template: ``,
  styles: ['']
})
export class ThirdLoginComponent implements OnInit, OnDestroy {
  private options: OptionEntity = {};
  private authCode = '';
  private appId = '';
  private scope = '';
  private from = '';
  private referer = '';
  private errCode = '';
  private adminUrl = '';

  private paramListener!: Subscription;
  private loginListener!: Subscription;

  constructor(
    @Optional() @Inject(RESPONSE) private response: Response,
    @Optional() @Inject(REQUEST) private request: Request,
    private route: ActivatedRoute,
    private optionService: OptionService,
    private userService: UserService,
    private authService: AuthService,
    private platform: PlatformService
  ) {}

  ngOnInit(): void {
    this.paramListener = this.route.queryParamMap
      .pipe(
        combineLatestWith(this.optionService.options$),
        tap(([params, options]) => {
          this.options = options;
          if (this.platform.isBrowser) {
            this.adminUrl = `${this.options['site_url'] || location.protocol + '//' + location.host}${ADMIN_URL}`;
          } else {
            this.adminUrl = `${this.options['site_url'] || this.request.protocol + '//' + this.request.hostname}${ADMIN_URL}`;
          }

          const ref = params.get('ref')?.trim() || '';
          try {
            this.referer = decodeURIComponent(ref);
          } catch (e) {
            this.referer = ref;
          }

          this.from = params.get('from')?.trim() || '';
          if (this.from === 'alipay' || this.from === 'm_alipay') {
            this.authCode = params.get('auth_code')?.trim() || '';
            this.appId = params.get('app_id')?.trim() || '';
            this.scope = params.get('scope')?.trim() || '';
          } else if (this.from === 'weibo') {
            this.authCode = params.get('code')?.trim() || '';
            this.errCode = params.get('error_code')?.trim() || '';
          } else if (this.from === 'github') {
            this.authCode = params.get('code')?.trim() || '';
            this.errCode = params.get('error')?.trim() || '';
          }
        })
      )
      .subscribe(() => {
        this.thirdLogin();
      });
  }

  ngOnDestroy(): void {
    this.paramListener.unsubscribe();
  }

  thirdLogin() {
    if (this.platform.isServer) {
      return;
    }
    if (this.from === 'weibo' && this.errCode === '21330') {
      // cancel
      window.close();
      return;
    }
    if (this.from === 'github' && this.errCode === 'access_denied') {
      // cancel
      window.close();
      return;
    }
    this.loginListener = this.userService.getThirdUser(this.authCode, this.from).subscribe((res) => {
      if (res.code === ResponseCode.SUCCESS) {
        if (this.from === 'm_alipay') {
          const redirectUrl = this.referer ? this.options['site_url'] + this.referer : this.adminUrl;
          location.replace(redirectUrl);
          return;
        }
        this.authService.setAuth(res.data, { username: '', password: '', rememberMe: false });
        window.opener.postMessage({ login: true }, window.origin);
        window.close();
      }
    });
  }
}
