import { Component, Inject, OnInit, Optional, PLATFORM_ID } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { RESPONSE } from '@nguniversal/express-engine/tokens';
import { Response } from 'express';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CookieService } from 'ngx-cookie-service';
import { BaseComponent } from '../../core/base.component';
import md5 from '../../helpers/md5';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less']
})
export class LoginComponent extends BaseComponent implements OnInit {
  loginForm = this.fb.group({
    username: [this.cookieService.get('username') || '', [Validators.required, Validators.maxLength(20)]],
    password: [null, [Validators.required, Validators.maxLength(20)]],
    rememberMe: [this.cookieService.get('rememberMe') || false]
  });
  autoFocus = {
    username: true,
    password: false
  };

  constructor(
    @Inject(PLATFORM_ID) protected readonly platform: Object,
    @Optional() @Inject(RESPONSE) protected readonly response: Response,
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly cookieService: CookieService,
    private readonly message: NzMessageService
  ) {
    super();
  }

  ngOnInit(): void {
    const username = this.cookieService.get('username');
    if (username) {
      this.autoFocus.username = false;
      this.autoFocus.password = true;
    }
    const rememberMe = this.cookieService.get('rememberMe');
    /* 登录状态直接跳转后台首页 */
    if ((rememberMe === '1' || rememberMe === 'true') && this.authService.getToken()) {
      if (this.isPlatformBrowser()) {
        location.href = '/admin';
      } else {
        this.response.redirect('/admin');
      }
    }
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
