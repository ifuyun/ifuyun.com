import { DOCUMENT } from '@angular/common';
import { HttpStatusCode } from '@angular/common/http';
import { ElementRef, Inject, Injectable, Optional, REQUEST, RESPONSE_INIT } from '@angular/core';
import { Router } from '@angular/router';
import { Request } from 'express';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { COOKIE_KEY_THEME, MEDIA_QUERY_THEME_DARK, MEDIA_QUERY_THEME_LIGHT } from '../config/common.constant';
import { Message } from '../config/message.enum';
import { Theme } from '../enums/common';
import { PageIndexInfo } from '../interfaces/common';
import { CustomError } from '../interfaces/custom-error';
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
    private readonly router: Router,
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
      isTool: topPage === 'tool',
      isAuth: topPage === 'auth',
      isPage: !['index', 'post', 'wallpaper', 'tool', 'auth'].includes(topPage),
      fullPage: pageIndex,
      subPage
    };
  }

  updateSiderVisible(visible: boolean) {
    this.siderVisible.next(visible);
  }

  getReferrer() {
    let referer = '';
    if (this.platform.isServer) {
      referer = this.request.headers.referer || <string>this.request.headers['referrer'] || '';
    } else {
      referer = this.document.referrer;
    }

    return referer;
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
}
