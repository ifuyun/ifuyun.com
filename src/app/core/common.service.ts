import { DOCUMENT } from '@angular/common';
import { ElementRef, Inject, Injectable, Optional } from '@angular/core';
import { Router } from '@angular/router';
// todo: remove from allowedCommonJsDependencies, since @nestjs/ng-universal/tokens is not exist
import { RESPONSE } from '@nestjs/ng-universal/dist/tokens';
import { Response } from 'express';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { MEDIA_QUERY_THEME_DARK, MEDIA_QUERY_THEME_LIGHT, STORAGE_KEY_THEME } from '../config/common.constant';
import { Theme } from '../config/common.enum';
import { OptionEntity } from '../interfaces/option.interface';
import { MetaData, PageOptions } from './common.interface';
import { PlatformService } from './platform.service';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private pageIndex: Subject<string> = new Subject<string>();
  public pageIndex$: Observable<string> = this.pageIndex.asObservable();

  private darkMode: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public darkMode$: Observable<boolean> = this.darkMode.asObservable();

  private pageOptions: BehaviorSubject<PageOptions> = new BehaviorSubject<PageOptions>({
    showHeader: true,
    showFooter: true,
    showMobileHeader: true,
    showMobileFooter: true
  });
  public pageOptions$: Observable<PageOptions> = this.pageOptions.asObservable();

  private adsFlag: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public adsFlag$: Observable<boolean> = this.adsFlag.asObservable();

  private jdUnionFlag: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public jdUnionFlag$: Observable<boolean> = this.jdUnionFlag.asObservable();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Optional() @Inject(RESPONSE) private response: Response,
    private router: Router,
    private platform: PlatformService,
    private readonly cookieService: CookieService
  ) {}

  updateActivePage(activePage: string) {
    this.pageIndex.next(activePage);
  }

  updatePageOptions(options: PageOptions) {
    this.pageOptions.next(options);
  }

  transformMeta(meta: MetaData[]): Record<string, string> {
    const result: Record<string, string> = {};
    meta.forEach((item) => (result[item.metaKey] = item.metaValue));
    return result;
  }

  getURL(options: OptionEntity, url: string) {
    return `${options['site_url']}${url}`;
  }

  getTheme(): Theme {
    const cacheTheme = this.cookieService.get(STORAGE_KEY_THEME);
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
    this.cookieService.set(STORAGE_KEY_THEME, theme, {
      path: '/',
      domain: environment.cookie.domain,
      expires: environment.cookie.expires
    });
  }

  isThemeCached(): boolean {
    return !!this.cookieService.get(STORAGE_KEY_THEME);
  }

  updateTheme(theme: Theme) {
    this.setTheme(theme);
    this.cacheTheme(theme);
  }

  updateJdUnionFlag(flag: boolean) {
    this.jdUnionFlag.next(flag);
  }

  addPaddingToImagePreview(eleRef: ElementRef) {
    eleRef.nativeElement.classList.add('preview-with-padding');
  }

  updateAdsFlag(isDisabled: boolean) {
    this.adsFlag.next(isDisabled);
  }

  redirectToNotFound() {
    if (this.platform.isBrowser) {
      this.router.navigate(['/404']);
    } else {
      this.response.redirect('/404');
    }
  }
}
