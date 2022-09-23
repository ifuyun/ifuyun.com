import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { AfterViewInit, Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RESPONSE } from '@nguniversal/express-engine/tokens';
import { Response } from 'express';
import { isEmpty, uniq } from 'lodash';
import { CookieService } from 'ngx-cookie-service';
import { skipWhile, Subscription } from 'rxjs';
import { MessageService } from '../../../components/message/message.service';
import { ADMIN_URL, THIRD_LOGIN_API, THIRD_LOGIN_CALLBACK } from '../../../config/constants';
import { CommonService } from '../../../core/common.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { PlatformService } from '../../../core/platform.service';
import { format, generateId } from '../../../helpers/helper';
import md5 from '../../../helpers/md5';
import { HTMLMetaData } from '../../../core/meta.interface';
import { OptionEntity } from '../../../interfaces/option.interface';
import { AuthService } from '../../../services/auth.service';
import { OptionService } from '../../../services/option.service';

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
        animate(
          duration,
          keyframes(offsets.concat(offsets.concat(offsets)).map((offset) => style({ marginLeft: `${offset}px` })))
        )
      ])
    ])
  ]
})
export class LoginComponent extends PageComponent implements OnInit, AfterViewInit, OnDestroy {
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

  protected pageIndex = 'login';

  private adminUrl = '';
  private options: OptionEntity = {};
  private loginWindow: Window | null = null;
  private readonly loginWindowName = 'login';
  private referer = '';

  private optionsListener!: Subscription;
  private paramListener!: Subscription;

  constructor(
    private fb: FormBuilder,
    private optionService: OptionService,
    private metaService: MetaService,
    private cookieService: CookieService,
    private commonService: CommonService,
    private authService: AuthService,
    private platform: PlatformService,
    private message: MessageService,
    private route: ActivatedRoute,
    @Optional() @Inject(RESPONSE) private response: Response
  ) {
    super();
  }

  ngOnInit(): void {
    this.optionsListener = this.optionService.options$
      .pipe(skipWhile((options) => isEmpty(options)))
      .subscribe((options) => {
        this.options = options;
        this.initMeta();
        this.updateActivePage();

        this.adminUrl = `${this.options['site_url'] || location.protocol + '//' + location.host}${ADMIN_URL}`;
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
    this.paramListener = this.route.queryParamMap.subscribe((queryParams) => {
      const ref = queryParams.get('ref')?.trim() || '';
      try {
        this.referer = decodeURIComponent(ref);
      } catch (e) {
        this.referer = ref;
      }
    });
    const username = this.cookieService.get('user');
    if (username) {
      this.autoFocus.username = false;
      this.autoFocus.password = true;
    }
  }

  ngAfterViewInit() {
    if (this.platform.isBrowser) {
      window.addEventListener(
        'message',
        (event) => {
          if (event.origin !== window.origin) {
            return;
          }
          if (event.data.login) {
            window.location.href = this.referer ? this.options['site_url'] + this.referer : this.adminUrl;
          }
        },
        false
      );
    }
  }

  ngOnDestroy() {
    this.optionsListener.unsubscribe();
    this.paramListener.unsubscribe();
  }

  login() {
    if (this.loginForm.valid) {
      const { username, password, rememberMe } = this.loginForm.value;
      this.authService
        .login({
          username: username || '',
          password: md5(password || ''),
          rememberMe: rememberMe || false
        })
        .subscribe((res) => {
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
        if (errors) {
          Object.keys(errors).forEach((type) => {
            switch (type) {
              case 'required':
                msgs.push(`请输入${formLabels[key]}`);
                break;
              case 'maxlength':
                msgs.push(
                  `${formLabels[key]}长度应不大于${errors[type].requiredLength}字符，当前为${errors[type].actualLength}`
                );
                break;
            }
          });
        }
      });
      msgs.length > 0 && this.message.error(msgs[0]);
    }
  }

  getUser(type: string) {
    if (!['alipay', 'weibo', 'github'].includes(type)) {
      return this.message.warning('This feature is developing, please wait...');
    }
    let url = '';
    switch (type) {
      case 'alipay':
        url = format(
          THIRD_LOGIN_API[type],
          this.options['open_alipay_app_id'],
          encodeURIComponent(`${this.options['site_url']}${format(THIRD_LOGIN_CALLBACK, 'alipay')}`),
          generateId()
        );
        break;
      case 'weibo':
        url = format(
          THIRD_LOGIN_API[type],
          this.options['open_weibo_app_key'],
          encodeURIComponent(`${this.options['site_url']}${format(THIRD_LOGIN_CALLBACK, 'weibo')}`)
        );
        break;
      case 'github':
        url = format(
          THIRD_LOGIN_API[type],
          this.options['open_github_client_id'],
          encodeURIComponent(`${this.options['site_url']}${format(THIRD_LOGIN_CALLBACK, 'github')}`),
          generateId()
        );
        break;
    }
    this.loginWindow = window.open(url, this.loginWindowName);
  }

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.pageIndex);
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
    setTimeout(() => (this.formStatus = 'normal'), duration);
  }
}
