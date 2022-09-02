import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatestWith, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ResponseCode } from '../../config/response-code.enum';
import { PlatformService } from '../../core/platform.service';
import { OptionEntity } from '../../interfaces/options';
import { AuthService } from '../../services/auth.service';
import { OptionsService } from '../../services/options.service';
import { UsersService } from '../../services/users.service';

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
  private errCode = '';
  private paramListener!: Subscription;
  private loginListener!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private optionsService: OptionsService,
    private usersService: UsersService,
    private authService: AuthService,
    private platform: PlatformService
  ) {}

  ngOnInit(): void {
    this.paramListener = this.route.queryParamMap
      .pipe(
        combineLatestWith(this.optionsService.options$),
        tap(([params, options]) => {
          this.options = options;

          this.from = params.get('from')?.trim() || '';
          if (this.from === 'alipay') {
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
    this.loginListener = this.usersService.getThirdUser(this.authCode, this.from).subscribe((res) => {
      if (res.code === ResponseCode.SUCCESS) {
        this.authService.setAuth(res.data, { username: '', password: '', rememberMe: false });
        window.opener.postMessage({ login: true }, window.origin);
        window.close();
      }
    });
  }
}
