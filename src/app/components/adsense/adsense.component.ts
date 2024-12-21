import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { isEmpty, uniq } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdsenseOptions } from '../../interfaces/adsense';
import { OptionEntity } from '../../interfaces/option';
import { ConsoleService } from '../../services/console.service';
import { DestroyService } from '../../services/destroy.service';
import { OptionService } from '../../services/option.service';
import { PlatformService } from '../../services/platform.service';
import { UserAgentService } from '../../services/user-agent.service';

@Component({
  selector: 'app-adsense',
  imports: [],
  providers: [DestroyService],
  templateUrl: './adsense.component.html'
})
export class AdsenseComponent implements AfterViewInit, OnDestroy {
  @ViewChild('adsense', { read: ElementRef, static: true }) adsenseEle!: ElementRef;

  @Input() dynamic = true;
  @Input() optionKey = '';
  @Input() placeholder = false;
  @Input() text = '';
  @Input() wrapClass = '';
  // full options
  @Input() clientId!: string;
  @Input() slotId!: string | number;
  @Input() format!: string;
  @Input() responsive!: boolean | undefined;
  @Input() className!: string;
  @Input() style!: string;
  @Input() display: string = 'inline-block';
  @Input() width!: number | string;
  @Input() height!: number | string;
  @Input() minWidth!: number | string;
  @Input() minHeight!: number | string;
  @Input() maxWidth!: number | string;
  @Input() maxHeight!: number | string;
  @Input() region = 'ad-' + Math.floor(Math.random() * 10000) + 1;
  @Input() testMode: boolean = false;

  isMobile = false;

  private readonly isDev = !environment.production;
  private readonly adsenseClass = 'adsbygoogle';
  private readonly customClass = 'ads-ins';

  private options: OptionEntity = {};
  // 开关配置
  private adsFlag = false;
  // 是否配置 clientId 和 slotId
  private isValid = false;
  private pageLevelAds = false;

  constructor(
    private readonly destroy$: DestroyService,
    private readonly platform: PlatformService,
    private readonly userAgentService: UserAgentService,
    private readonly optionService: OptionService,
    private readonly console: ConsoleService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngAfterViewInit(): void {
    if (this.platform.isServer) {
      return;
    }
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => {
        this.options = options;

        const adsFlag = options['ads_flag'] || '';
        this.adsFlag = (!this.isDev && ['1', '0'].includes(adsFlag)) || (this.isDev && ['2', '0'].includes(adsFlag));

        this.initOptions();
        this.initAdsense();
      });
  }

  ngOnDestroy(): void {
    const iframe = this.adsenseEle?.nativeElement.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.src = 'about:blank';
      iframe.remove();
    }
  }

  private initOptions() {
    const defaults: AdsenseOptions = {
      clientId: '',
      slotId: '',
      format: '',
      className: '',
      style: '',
      display: 'inline-block',
      region: 'ad-' + Math.floor(Math.random() * 10000) + 1,
      testMode: false
    };
    let adsenseOptions: Partial<AdsenseOptions> = {};
    if (this.dynamic && this.optionKey) {
      try {
        adsenseOptions = JSON.parse(this.options[this.optionKey]);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {}
    }
    adsenseOptions = {
      ...defaults,
      ...adsenseOptions
    };
    this.clientId = this.clientId ?? adsenseOptions.clientId;
    this.slotId = this.slotId ?? adsenseOptions.slotId;
    this.format = this.format ?? adsenseOptions.format;
    this.responsive = this.responsive ?? adsenseOptions.responsive;
    this.style = this.style ?? adsenseOptions.style;
    this.display = this.display ?? adsenseOptions.display;
    this.width = this.parseSize(this.width ?? adsenseOptions.width);
    this.height = this.parseSize(this.height ?? adsenseOptions.height);
    this.minWidth = this.parseSize(this.minWidth ?? adsenseOptions.minWidth);
    this.minHeight = this.parseSize(this.minHeight ?? adsenseOptions.minHeight);
    this.maxWidth = this.parseSize(this.maxWidth ?? adsenseOptions.maxWidth);
    this.maxHeight = this.parseSize(this.maxHeight ?? adsenseOptions.maxHeight);
    this.testMode = this.testMode ?? adsenseOptions.testMode;
    this.isValid = !!(this.clientId && this.slotId);

    const className = [
      this.adsenseClass,
      this.className,
      adsenseOptions.className,
      this.isMobile ? `m-${this.customClass}` : `p-${this.customClass}`
    ];
    this.className = uniq(className.filter((item) => !!item)).join(' ');
  }

  private initAdsense() {
    if (this.platform.isBrowser) {
      if (this.adsFlag && this.isValid) {
        const ads: Record<string, string | boolean> = {};
        if (this.pageLevelAds) {
          ads['google_ad_client'] = this.clientId;
          ads['enable_page_level_ads'] = true;
        }
        try {
          this.renderAdsense();

          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push(ads);
          if (Array.isArray((window as any).adsbygoogle)) {
            this.console.warn('Ads is blocked.');
            this.hideAdsense();
          }
        } catch (e: any) {
          this.console.error(e.message || 'Ads is not working.');
          this.hideAdsense();
        }
      } else {
        this.console.warn('Ads is disabled.');
        this.hideAdsense();
      }
    }
  }

  private renderAdsense() {
    if (!this.adsenseEle) {
      return;
    }
    const adsBodyEle = document.createElement('ins');

    adsBodyEle.className = this.className;
    adsBodyEle.setAttribute('style', this.style);
    adsBodyEle.style.display = this.display;

    if (this.width && (!this.placeholder || (this.placeholder && this.width !== '0' && this.width !== '0px'))) {
      adsBodyEle.style.width = this.width + '';
    }
    if (this.height && (!this.placeholder || (this.placeholder && this.height !== '0' && this.height !== '0px'))) {
      adsBodyEle.style.height = this.height + '';
    }
    if (this.minWidth) {
      adsBodyEle.style.minWidth = this.minWidth + '';
    }
    if (this.minHeight) {
      adsBodyEle.style.minHeight = this.minHeight + '';
    }
    if (this.maxWidth) {
      adsBodyEle.style.maxWidth = this.maxWidth + '';
    }
    if (this.maxHeight) {
      adsBodyEle.style.maxHeight = this.maxHeight + '';
    }

    adsBodyEle.setAttribute('data-ad-client', this.clientId);
    adsBodyEle.setAttribute('data-ad-slot', this.slotId + '');
    adsBodyEle.setAttribute('data-ad-region', this.region);
    if (this.format) {
      adsBodyEle.setAttribute('data-ad-format', this.format);
    }
    if (this.testMode) {
      adsBodyEle.setAttribute('data-ad-adtest', 'on');
    }
    if (typeof this.responsive === 'boolean') {
      adsBodyEle.setAttribute('data-full-width-responsive', this.responsive + '');
    }

    const adsEle = this.adsenseEle.nativeElement;
    if (this.wrapClass) {
      adsEle.classList.add(this.wrapClass);
    }
    adsEle.classList.remove('ads-border');
    adsEle.appendChild(adsBodyEle);
  }

  private hideAdsense() {
    // placeholder 为 true 时，显示占位内容
    if (!this.placeholder && this.adsenseEle) {
      this.adsenseEle.nativeElement.style.display = 'none';
    }
  }

  private parseSize(size: number | string): string {
    return typeof size === 'number' ? (size ? size + 'px' : '0') : size;
  }
}
