import { Inject, Injectable, Optional, REQUEST } from '@angular/core';
import { IBrowser, ICPU, IDevice, IEngine, IOS, IResult, UAParser } from 'ua-parser-js';
import { UserAgentInfo } from '../interfaces/common';
import { PlatformService } from './platform.service';

@Injectable({
  providedIn: 'root'
})
export class UserAgentService {
  private readonly _uaResult!: IResult;
  private readonly _uaString: string;

  constructor(
    private readonly platform: PlatformService,
    @Optional() @Inject(REQUEST) private readonly request: Request
  ) {
    this._uaString = this.platform.isBrowser ? navigator.userAgent : this.request?.headers.get('user-agent') || '';
    this._uaResult = UAParser(this._uaString);
  }

  get browser(): IBrowser {
    return this._uaResult.browser;
  }

  get engine(): IEngine {
    return this._uaResult.engine;
  }

  get os(): IOS {
    return this._uaResult.os;
  }

  get device(): IDevice {
    return this._uaResult.device;
  }

  get cpu(): ICPU {
    return this._uaResult.cpu;
  }

  get uaResult() {
    return this._uaResult;
  }

  get uaString() {
    return this._uaString;
  }

  get uaInfo(): UserAgentInfo {
    return {
      os: this.os.name || '',
      osVersion: this.os.version || '',
      architecture: this.cpu.architecture || '',
      browser: this.browser.name || '',
      browserVersion: this.browser.version || '',
      engine: this.engine.name || '',
      engineVersion: this.engine.version || '',
      isMobile: this.isMobile,
      isDesktop: this.isDesktop,
      isCrawler: this.isCrawler,
      userAgent: this._uaString
    };
  }

  get isIE() {
    return this.checkBrowser(['IE', 'compatible', 'MSIE']);
  }

  get isEdge() {
    return this.checkBrowser(['Edge']);
  }

  get isChrome() {
    return this.checkBrowser(['Chrome', 'Chromium']);
  }

  get isFirefox() {
    return this.checkBrowser(['firefox']);
  }

  get isSafari() {
    return this.checkBrowser(['Safari']);
  }

  get isWechat() {
    return this.checkBrowser(['Wechat']);
  }

  get isIOS() {
    return this.os.name === 'iOS';
  }

  get isAndroid() {
    return this.os.name === 'Android';
  }

  get isMac() {
    return this.os.name === 'Mac OS';
  }

  get isMobile() {
    return this.device.type === 'mobile';
  }

  get isDesktop() {
    return !this.isMobile;
  }

  get isCrawler() {
    return (
      !this.os.name ||
      !this.browser.name ||
      /spider|googlebot|bingbot|applebot|amazonbot|crawler|robot/i.test(this._uaString) ||
      /Mediapartners-Google|APIs-Google|AdsBot-Google|GoogleAdSenseInfeed/i.test(this._uaString) ||
      /Storebot-Google|Google-InspectionTool|GoogleOther/i.test(this._uaString)
    );
  }

  private checkBrowser(browserNames: string[]) {
    return browserNames.some((browser) => browser.toLowerCase() === (this.browser.name || '').toLowerCase());
  }
}
