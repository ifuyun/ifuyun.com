import { Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { RESPONSE } from '@nguniversal/express-engine/tokens';
import { Response } from 'express';
import { uniq } from 'lodash';
import { CookieService } from 'ngx-cookie-service';
import { Subscription } from 'rxjs';
import { MessageService } from '../../components/message/message.service';
import { PlatformService } from '../../core/platform.service';
import md5 from '../../helpers/md5';
import { HTMLMetaData } from '../../interfaces/meta';
import { OptionEntity } from '../../interfaces/options';
import { AuthService } from '../../services/auth.service';
import { CustomMetaService } from '../../services/custom-meta.service';
import { OptionsService } from '../../services/options.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm = this.fb.group({
    username: [this.cookieService.get('username') || '', [Validators.required, Validators.maxLength(20)]],
    password: [null, [Validators.required, Validators.maxLength(20)]],
    rememberMe: [this.cookieService.get('rememberMe') === '1']
  });
  autoFocus = {
    username: true,
    password: false
  };

  private options: OptionEntity = {};
  private optionsListener!: Subscription;

  constructor(
    private optionsService: OptionsService,
    private metaService: CustomMetaService,
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
      const titles = ['登录', this.options['site_name']];
      const keywords: string[] = (this.options['site_keywords'] || '').split(',');
      const metaData: HTMLMetaData = {
        title: titles.join(' - '),
        description: this.options['site_description'],
        author: this.options['site_author'],
        keywords: uniq(keywords).join(',')
      };
      this.metaService.updateHTMLMeta(metaData);
    });
    const username = this.cookieService.get('username');
    if (username) {
      this.autoFocus.username = false;
      this.autoFocus.password = true;
    }
    const rememberMe = this.cookieService.get('rememberMe');
    /* 登录状态直接跳转后台首页 */
    if (rememberMe === '1' && this.authService.isLoggedIn()) {
      if (this.platform.isBrowser) {
        location.href = '/admin';
      } else {
        this.response.redirect('/admin');
      }
    }
  }

  ngOnDestroy() {
    this.optionsListener.unsubscribe();
  }

  login() {
    if (this.loginForm.valid) {
      const { username, password, rememberMe } = this.loginForm.value;
      this.authService.login({
        username,
        password: md5(password),
        rememberMe
      }).subscribe((res) => {
        if (res.accessToken) {
          location.href = '/admin';
        }
      });
    } else {
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
      msgs.forEach((msg) => this.message.error(msg));
    }
  }
}
