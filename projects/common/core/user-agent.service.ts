import { Inject, Injectable, Optional, REQUEST } from '@angular/core';
import { IBrowser, ICPU, IDevice, IEngine, IOS, IResult, UAParser } from 'ua-parser-js';
import { PlatformService } from './platform.service';

@Injectable({
  providedIn: 'root'
})
export class UserAgentService {
  private readonly _uaResult!: IResult;
  private readonly _uaString: string;

  constructor(
    private readonly platform: PlatformService,
    @Optional() @Inject(REQUEST) private readonly request: any
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

  private checkBrowser(browserNames: string[]) {
    return browserNames.some((browser) => browser.toLowerCase() === (this.browser.name || '').toLowerCase());
  }
}
