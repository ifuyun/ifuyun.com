import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatestWith, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ADMIN_URL } from '../../config/constants';
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
  private adminUrl = '';
  private authCode = '';
  private appId = '';
  private scope = '';
  private from = '';
  private paramListener!: Subscription;
  private loginListener!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private optionsService: OptionsService,
    private usersService: UsersService,
    private authService: AuthService,
    private platform: PlatformService
  ) {
  }

  ngOnInit(): void {
    this.paramListener = this.route.queryParamMap.pipe(
      combineLatestWith(this.optionsService.options$),
      tap(([params, options]) => {
        this.authCode = params.get('auth_code')?.trim() || '';
        this.appId = params.get('app_id')?.trim() || '';
        this.scope = params.get('scope')?.trim() || '';
        this.from = params.get('from')?.trim() || '';
        this.options = options;
        this.adminUrl = `${this.options['site_url']}${ADMIN_URL}`;
      })
    ).subscribe(() => {
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
    if (this.from === 'alipay') {
      this.loginListener = this.usersService.getAlipayUser(this.authCode).subscribe((res) => {
        if (res.code === ResponseCode.SUCCESS) {
          this.authService.setAuth(res.data, { username: '', password: '', rememberMe: false });
          const urlSearch = new URL(window.opener.location.href).search.split('?');
          let referer = '';
          if (urlSearch.length > 1) {
            const temp = urlSearch[1].split('&')
              .map((item) => item.split('='))
              .filter((item) => item[0] === 'ref');
            referer = temp.length > 0 ? decodeURIComponent(temp[0][1]) : '';
          }
          window.opener.location.href = referer ? (this.options['site_url'] + referer) : this.adminUrl;
          window.close();
        }
      });
    }
  }
}
