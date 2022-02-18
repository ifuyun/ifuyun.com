import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import * as md5 from 'crypto-js/md5';
import { CookieService } from 'ngx-cookie-service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cookieService: CookieService
  ) {
  }

  ngOnInit(): void {
  }

  login() {
    if (this.loginForm.valid) {
      const { username, password, rememberMe } = this.loginForm.value;
      this.authService.login({
        username,
        password: md5(password).toString()
      }).subscribe((res) => {
        // todo: error case
        if (res.accessToken) {
          this.authService.setSession(res);
          if (rememberMe === true || rememberMe === '1') {
            this.cookieService.set('username', username, {
              path: '/',
              domain: environment.cookie.domain,
              expires: environment.cookie.expires
            });
            this.cookieService.set('rememberMe', '1', {
              path: '/',
              domain: environment.cookie.domain,
              expires: environment.cookie.expires
            });
          }
        }
      });
    }
  }
}
