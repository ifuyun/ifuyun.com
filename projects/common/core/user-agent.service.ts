import { inject, Injectable, REQUEST } from '@angular/core';
import { IBrowser, ICPU, IDevice, IEngine, IOS, UAParser } from 'ua-parser-js';
import { PlatformService } from './platform.service';

@Injectable({
  providedIn: 'root'
})
export class UserAgentService {
  private readonly platform = inject(PlatformService);
  private readonly request = inject(REQUEST);
  private readonly _uaString = this.platform.isBrowser
    ? navigator.userAgent
    : this.request?.headers.get('user-agent') || '';
  private readonly _uaResult = UAParser(this._uaString);

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
    return this.os.name === 'macOS';
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
