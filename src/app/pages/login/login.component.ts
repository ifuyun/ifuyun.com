import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { RESPONSE } from '@nguniversal/express-engine/tokens';
import { Response } from 'express';
import { CookieService } from 'ngx-cookie-service';
import { MessageService } from '../../components/message/message.service';
import { PlatformService } from '../../core/platform.service';
import md5 from '../../helpers/md5';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less']
})
export class LoginComponent implements OnInit {
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
    private fb: FormBuilder,
    private cookieService: CookieService,
    private authService: AuthService,
    private platform: PlatformService,
    private message: MessageService,
    @Optional() @Inject(RESPONSE) protected response: Response
  ) {
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
      if (this.platform.isBrowser) {
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
