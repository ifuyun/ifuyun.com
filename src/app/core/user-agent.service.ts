import { Inject, Injectable, Optional } from '@angular/core';
import { REQUEST } from '@nestjs/ng-universal/dist/tokens';
import { Request } from 'express';
import { IBrowser, ICPU, IDevice, IEngine, IOS, IResult, UAParser } from 'ua-parser-js';
import { UserAgentData } from './common.interface';
import { PlatformService } from './platform.service';

@Injectable({
  providedIn: 'root'
})
export class UserAgentService {
  public readonly userAgent!: IResult;

  private uaString = '';

  constructor(
    private platform: PlatformService,
    @Optional() @Inject(REQUEST) private request: Request
  ) {
    this.uaString = this.platform.isBrowser ? navigator.userAgent : this.request.headers['user-agent'] || '';
    this.userAgent = UAParser(this.uaString);
  }

  get browser(): IBrowser {
    return this.userAgent.browser;
  }

  get engine(): IEngine {
    return this.userAgent.engine;
  }

  get os(): IOS {
    return this.userAgent.os;
  }

  get device(): IDevice {
    return this.userAgent.device;
  }

  get cpu(): ICPU {
    return this.userAgent.cpu;
  }

  getUserAgentString() {
    return this.uaString;
  }

  getUserAgentInfo(): UserAgentData {
    return {
      os: this.os.name || '',
      osVersion: this.os.version || '',
      architecture: this.cpu.architecture || '',
      browser: this.browser.name || '',
      browserVersion: this.browser.version || '',
      engine: this.engine.name || '',
      engineVersion: this.engine.version || '',
      isMobile: this.isMobile() ? 1 : 0,
      isCrawler: this.isCrawler() ? 1 : 0,
      userAgent: this.uaString
    };
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

  isCrawler() {
    // 常规爬虫
    if (/spider|googlebot|crawler|robot/i.test(this.uaString)) {
      return true;
    }
    return /Mediapartners-Google|Storebot-Google|Google-InspectionTool|GoogleOther|APIs-Google|AdsBot-Google/i.test(
      this.uaString
    );
  }

  private checkBrowser(browserNames: string[]) {
    return browserNames.some((browser) => browser.toLowerCase() === (this.browser.name || '').toLowerCase());
  }
}
