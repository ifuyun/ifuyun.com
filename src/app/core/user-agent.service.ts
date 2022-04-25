import { Inject, Injectable, Optional } from '@angular/core';
import { REQUEST } from '@nguniversal/express-engine/tokens';
import { Request } from 'express';
import { IBrowser, IDevice, IOS, IResult, UAParser } from 'ua-parser-js';
import { PlatformService } from './platform.service';

@Injectable({
  providedIn: 'root'
})
export class UserAgentService {
  public readonly userAgent!: IResult;

  private userAgentString: string = '';

  constructor(
    private platform: PlatformService,
    @Optional() @Inject(REQUEST) private request: Request
  ) {
    this.userAgentString = this.platform.isBrowser ? navigator.userAgent : (this.request.headers['user-agent'] || '');
    this.userAgent = UAParser(this.userAgentString);
  }

  get browser(): IBrowser {
    return this.userAgent.browser;
  }

  get os(): IOS {
    return this.userAgent.os;
  }

  get device(): IDevice {
    return this.userAgent.device;
  }

  getUserAgentString() {
    return this.userAgentString;
  }

  isIE() {
    return this.checkBrowser(['IE', 'compatible', 'MSIE']);
  }

  isEdge() {
    return this.checkBrowser(['Edge']);
  }

  isChrome() {
    return this.checkBrowser(['Chrome', 'Chromium']);
  }

  isFirefox() {
    return this.checkBrowser(['firefox']);
  }

  isSafari() {
    return this.checkBrowser(['Safari']);
  }

  isWechat() {
    return this.checkBrowser(['Wechat']);
  }

  isIOS() {
    return this.os.name === 'iOS';
  }

  isAndroid() {
    return this.os.name === 'Android';
  }

  isMac() {
    return this.os.name === 'Mac OS';
  }

  isMobile() {
    return this.device.type === 'mobile';
  }

  isDesktop() {
    return !this.isMobile();
  }

  private checkBrowser(browserNames: string[]) {
    return browserNames.some((browser) => browser.toLowerCase() === (this.browser.name || '').toLowerCase());
  }
}
