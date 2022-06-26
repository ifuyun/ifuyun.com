import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { RESPONSE } from '@nguniversal/express-engine/tokens';
import { Response } from 'express';
import { uniq } from 'lodash';
import { CookieService } from 'ngx-cookie-service';
import { Subscription } from 'rxjs';
import { MessageService } from '../../components/message/message.service';
import { ADMIN_URL, THIRD_LOGIN_API, THIRD_LOGIN_CALLBACK } from '../../config/constants';
import { PlatformService } from '../../core/platform.service';
import { format, generateId } from '../../helpers/helper';
import md5 from '../../helpers/md5';
import { HTMLMetaData } from '../../interfaces/meta';
import { OptionEntity } from '../../interfaces/options';
import { AuthService } from '../../services/auth.service';
import { MetaService } from '../../core/meta.service';
import { OptionsService } from '../../services/options.service';

const margin = 24;
const offsets = [margin, 0, -margin, 0];
const duration = 500; // ms

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less'],
  animations: [
    trigger('shakeForm', [
      state('normal', style({})),
      state('shaking', style({})),

      transition('* => shaking', [
        animate(duration, keyframes(
          offsets.concat(offsets.concat(offsets)).map((offset) => style({ marginLeft: `${offset}px` }))
        ))
      ])
    ])
  ]
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm = this.fb.group({
    username: [this.cookieService.get('user') || '', [Validators.required, Validators.maxLength(20)]],
    password: [null, [Validators.required, Validators.maxLength(20)]],
    rememberMe: [this.cookieService.get('remember') === '1']
  });
  autoFocus = {
    username: true,
    password: false
  };
  formStatus: 'normal' | 'shaking' = 'normal';

  private adminUrl = '';
  private options: OptionEntity = {};
  private loginWindow: Window | null = null;
  private readonly loginWindowName = 'login';

  private optionsListener!: Subscription;

  constructor(
    private optionsService: OptionsService,
    private metaService: MetaService,
    private fb: FormBuilder,
    private cookieService: CookieService,
    private authService: AuthService,
    private platform: PlatformService,
    private message: MessageService,
    @Optional() @Inject(RESPONSE) protected response: Response
  ) {
  }

  ngOnInit(): void {
    this.optionsListener = this.optionsService.options$.subscribe((options) => {
      this.options = options;
      this.initMeta();

      this.adminUrl = `${this.options['site_url']}${ADMIN_URL}`;
      const rememberMe = this.cookieService.get('remember');
      /* 登录状态直接跳转后台首页 */
      if (rememberMe === '1' && this.authService.isLoggedIn()) {
        if (this.platform.isBrowser) {
          location.href = this.adminUrl;
        } else {
          this.response.redirect(this.adminUrl);
        }
      }
    });
    const username = this.cookieService.get('user');
    if (username) {
      this.autoFocus.username = false;
      this.autoFocus.password = true;
    }
  }

  ngOnDestroy() {
    this.optionsListener.unsubscribe();
  }

  login() {
    if (this.loginForm.valid) {
      const { username, password, rememberMe } = this.loginForm.value;
      this.authService.login({
        username: username || '',
        password: md5(password || ''),
        rememberMe: rememberMe || false
      }).subscribe((res) => {
        if (res.accessToken) {
          location.href = this.adminUrl;
        } else {
          this.shakeForm();
        }
      });
    } else {
      this.shakeForm();

      const formLabels: Record<string, string> = {
        username: '用户名',
        password: '密码'
      };
      const msgs: string[] = [];
      Object.keys(this.loginForm.controls).forEach((key) => {
        const ctrl = this.loginForm.get(key);
        const errors = ctrl?.errors;
        errors && Object.keys(errors).forEach((type) => {
          switch (type) {
            case 'required':
              msgs.push(`请输入${formLabels[key]}`);
              break;
            case 'maxlength':
              msgs.push(`${formLabels[key]}长度应不大于${errors[type].requiredLength}字符，当前为${errors[type].actualLength}`);
              break;
          }
        });
      });
      msgs.length > 0 && this.message.error(msgs[0]);
    }
  }

  getUser(type: string) {
    if (type !== 'alipay') {
      return this.message.warning('This feature is developing, please wait...');
    }
    this.loginWindow = window.open(format(
      THIRD_LOGIN_API[type],
      this.options['open_app_id_alipay'],
      encodeURIComponent(`${this.options['site_url']}${format(THIRD_LOGIN_CALLBACK, 'alipay')}`),
      generateId()
    ), this.loginWindowName);
  }

  private initMeta() {
    const titles = ['登录', this.options['site_name']];
    const keywords: string[] = (this.options['site_keywords'] || '').split(',');
    const metaData: HTMLMetaData = {
      title: titles.join(' - '),
      description: this.options['site_description'],
      author: this.options['site_author'],
      keywords: uniq(keywords).join(',')
    };
    this.metaService.updateHTMLMeta(metaData);
  }

  private shakeForm() {
    this.formStatus = 'shaking';
    setTimeout(() => this.formStatus = 'normal', duration);
  }
}
