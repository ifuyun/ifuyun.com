import { DOCUMENT } from '@angular/common';
import { HttpStatusCode } from '@angular/common/http';
import { ElementRef, Inject, Injectable, Optional, REQUEST, RESPONSE_INIT } from '@angular/core';
import { Request } from 'express';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import {
  COOKIE_KEY_THEME,
  COOKIE_KEY_USER_ID,
  MEDIA_QUERY_THEME_DARK,
  MEDIA_QUERY_THEME_LIGHT
} from 'src/app/config/common.constant';
import { Message } from 'src/app/config/message.enum';
import { Theme } from 'src/app/enums/common';
import { PageIndexInfo } from 'src/app/interfaces/common';
import { CustomError } from 'src/app/interfaces/custom-error';
import { environment } from 'src/environments/environment';
import { PlatformService } from './platform.service';
import { SsrCookieService } from './ssr-cookie.service';

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
    @Optional() @Inject(REQUEST) private readonly request: Request,
    @Optional() @Inject(RESPONSE_INIT) private readonly response: any,
    private readonly platform: PlatformService,
    private readonly cookieService: SsrCookieService
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

  getReferrer() {
    if (this.platform.isServer) {
      const headers: any = this.request?.headers;
      if (headers) {
        const referrer: string = headers.get('referer') || headers.get('referrer') || '';
        return referrer.replace(/^https?:\/\/[^/]+/i, '');
      }
      return '';
    }
    return this.document.referrer.replace(/^https?:\/\/[^/]+/i, '');
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
      domain: environment.cookie.domain,
      expires: environment.cookie.expires
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
}
