import { DOCUMENT } from '@angular/common';
import { HttpStatusCode } from '@angular/common/http';
import { ElementRef, Inject, Injectable, Optional, REQUEST, RESPONSE_INIT } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import {
  ApiService,
  ApiUrl,
  AppConfigService,
  CDN_HOST,
  COOKIE_KEY_THEME,
  COOKIE_KEY_TURNSTILE_ID,
  COOKIE_KEY_USER_ID,
  CustomError,
  HttpResponseEntity,
  MEDIA_QUERY_THEME_DARK,
  MEDIA_QUERY_THEME_LIGHT,
  Message,
  PageIndexInfo,
  PlatformService,
  SsrCookieService,
  UserAgentService
} from 'common/core';
import { Theme } from 'common/enums';
import { isSuspiciousReferrer, isSuspiciousResolution } from 'common/middlewares';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private pageIndex: Subject<string> = new Subject<string>();
  public pageIndex$: Observable<string> = this.pageIndex.asObservable();

  private siderVisible: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public siderVisible$: Observable<boolean> = this.siderVisible.asObservable();

  private darkMode: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public darkMode$: Observable<boolean> = this.darkMode.asObservable();

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Optional() @Inject(REQUEST) private readonly request: any,
    @Optional() @Inject(RESPONSE_INIT) private readonly response: any,
    private readonly router: Router,
    private readonly platform: PlatformService,
    private readonly cookieService: SsrCookieService,
    private readonly userAgentService: UserAgentService,
    private readonly appConfigService: AppConfigService,
    private readonly apiService: ApiService
  ) {}

  updatePageIndex(pageIndex: string) {
    this.pageIndex.next(pageIndex);
  }

  getPageIndexInfo(pageIndex: string): PageIndexInfo {
    const topPage = pageIndex.split('-')[0];
    const subPage = pageIndex.split('-')[1];

    return {
      isHome: pageIndex === 'index',
      isPost: topPage === 'post',
      isWallpaper: topPage === 'wallpaper',
      isJigsaw: topPage === 'jigsaw',
      isGame: topPage === 'game',
      isTool: topPage === 'tool',
      isSearch: topPage === 'search',
      isAuth: topPage === 'auth',
      isArticle: pageIndex === 'post-article',
      isPage: topPage === 'page',
      fullPage: pageIndex,
      subPage
    };
  }

  updateSiderVisible(visible: boolean) {
    this.siderVisible.next(visible);
  }

  getReferrer(onlyPath = false) {
    let referrer: string;
    if (this.platform.isServer) {
      const headers = this.request?.headers;
      referrer = headers ? headers.get('referer') || headers.get('referrer') || '' : '';
    } else {
      referrer = this.document.referrer || '';
    }

    return onlyPath ? referrer.replace(/^https?:\/\/[^/]+/i, '') : referrer;
  }

  getHost() {
    if (this.platform.isServer) {
      return new URL(this.request.url).host;
    }
    return location.host;
  }

  getHostName() {
    if (this.platform.isServer) {
      return new URL(this.request.url).hostname;
    }
    return location.hostname;
  }

  isSameHost(url: string): boolean {
    const curHost = this.getHost();

    return curHost === new URL(url).host;
  }

  getResolution() {
    return this.platform.isBrowser ? window.screen.width + 'x' + window.screen.height : '';
  }

  smartNavigate(path: string, host: string, extras?: NavigationExtras): void {
    if (this.isSameHost(host)) {
      this.router.navigate([path], extras);
    } else {
      let queryStr = '';
      if (extras?.queryParams) {
        queryStr = Object.entries(extras.queryParams)
          .map(([key, value]) => {
            if ((typeof value === 'string' || typeof value === 'number') && (value || value === 0)) {
              return key + '=' + value;
            }
            return '';
          })
          .filter((item) => !!item)
          .join('&');
      }
      location.href = host + path + (queryStr ? '?' + queryStr : '');
    }
  }

  getCdnUrlPrefix() {
    if (this.appConfigService.isDev) {
      return '';
    }
    const curApp = this.getHostName().split('.')[0];

    return CDN_HOST + '/' + curApp;
  }

  getShareURL(userId?: string) {
    userId = userId || this.cookieService.get(COOKIE_KEY_USER_ID);

    const shareUrl = location.href.split('#')[0];
    const param = (shareUrl.includes('?') ? '&' : '?') + 'ref=qrcode' + (userId ? '&uid=' + userId : '');

    return shareUrl + param;
  }

  getTheme(): Theme {
    const cacheTheme = this.cookieService.get(COOKIE_KEY_THEME);
    if (cacheTheme) {
      return cacheTheme === Theme.Dark ? Theme.Dark : Theme.Light;
    }
    if (this.platform.isBrowser) {
      if (window.matchMedia(MEDIA_QUERY_THEME_DARK).matches) {
        return Theme.Dark;
      }
      if (window.matchMedia(MEDIA_QUERY_THEME_LIGHT).matches) {
        return Theme.Light;
      }
    }
    // todo: init by different time zone
    const curHour = new Date().getHours();
    const isNight = curHour >= 19 || curHour <= 6;

    return isNight ? Theme.Dark : Theme.Light;
  }

  setTheme(theme: Theme) {
    const htmlNode = this.document.getElementsByTagName('html')[0];
    htmlNode.setAttribute('data-theme', theme);
    this.darkMode.next(theme === Theme.Dark);
  }

  cacheTheme(theme: Theme) {
    this.cookieService.set(COOKIE_KEY_THEME, theme, {
      path: '/',
      domain: this.appConfigService.cookieDomain,
      expires: this.appConfigService.cookieExpires
    });
  }

  isThemeCached(): boolean {
    return !!this.cookieService.get(COOKIE_KEY_THEME);
  }

  updateTheme(theme: Theme) {
    this.setTheme(theme);
    this.cacheTheme(theme);
  }

  paddingPreview(eleRef: ElementRef) {
    eleRef.nativeElement.classList.add('preview-padding');
  }

  redirectToNotFound() {
    if (this.platform.isServer) {
      this.response.status = HttpStatusCode.NotFound;
    }
    throw new CustomError(Message.ERROR_404, HttpStatusCode.NotFound);
  }

  redirectToForbidden() {
    if (this.platform.isServer) {
      this.response.status = HttpStatusCode.Forbidden;
    }
    throw new CustomError(Message.ERROR_403, HttpStatusCode.Forbidden);
  }

  serializeParams(params: Record<string, any>): string {
    return Object.keys(params)
      .sort()
      .map((key) => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
  }

  async generateHmacSignature(message: string, secret: string): Promise<string> {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: { name: 'SHA-256' } },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));

    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  isSuspicious() {
    // 已知的 UA 已经拦截，除了 referrer 和 分辨率，还需要判断其它可能的 UA 和 IP 地址，或者调用三方接口判断
    const turnstileId = this.cookieService.get(COOKIE_KEY_TURNSTILE_ID);
    // 半小时内如果已经验证过，直接跳过
    // todo: 需要调接口判断是否真实存在
    if (turnstileId) {
      return false;
    }
    const referrer = this.getReferrer(false);
    const resolution = this.getResolution();

    return (
      !this.userAgentService.os.name ||
      !this.userAgentService.browser.name ||
      isSuspiciousReferrer(referrer) ||
      (this.platform.isBrowser && isSuspiciousResolution(resolution))
    );
  }

  verifyTurnstile(token: string): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(
      ApiUrl.UTIL_TURNSTILE_VERIFY,
      {
        token,
        appId: this.appConfigService.appId
      },
      true
    );
  }
}
