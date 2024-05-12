import { CommonModule, DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, Input, OnDestroy, ViewChild } from '@angular/core';
import { isEmpty, uniq } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
import { environment as env } from '../../../environments/environment';
import { APP_ID } from '../../config/common.constant';
import { CommonService } from '../../core/common.service';
import { ConsoleService } from '../../core/console.service';
import { DestroyService } from '../../core/destroy.service';
import { PlatformService } from '../../core/platform.service';
import { UserAgentService } from '../../core/user-agent.service';
import { ActionType, ActionObjectType } from '../../interfaces/log.enum';
import { OptionEntity } from '../../interfaces/option.interface';
import { LogService } from '../../services/log.service';
import { OptionService } from '../../services/option.service';
import { AdsenseConfig } from './adsense.interface';

@Component({
  selector: 'i-adsense',
  template: `
    <div
      #adsense
      class="ads-wrap"
      [class.ads-wrap-desktop]="!isMobile"
      [class.ads-wrap-mobile]="isMobile"
      (click)="logClick()"
    ></div>
  `,
  styleUrls: [],
  standalone: true,
  imports: [CommonModule],
  providers: [DestroyService]
})
export class AdsenseComponent implements AfterViewInit, OnDestroy {
  @ViewChild('adsense', { read: ElementRef, static: true }) adsenseEle!: ElementRef;

  @Input() dynamic = true;
  @Input() optionKey = '';
  @Input() position = '';
  // full options
  @Input() clientId!: string;
  @Input() slotId!: string | number;
  @Input() format!: string;
  @Input() responsive!: boolean | undefined;
  @Input() className!: string;
  @Input() style!: string;
  @Input() display!: string;
  @Input() width!: number | string;
  @Input() height!: number | string;
  @Input() minWidth!: number | string;
  @Input() minHeight!: number | string;
  @Input() maxWidth!: number | string;
  @Input() maxHeight!: number | string;
  @Input() region = 'ad-' + Math.floor(Math.random() * 10000) + 1;
  @Input() testMode!: boolean;

  isMobile = false;
  visible = false;

  private readonly adsenseClass = 'adsbygoogle';
  private readonly customClassPrefix = 'make-money';

  private adsenseFlag = false;
  private options: OptionEntity = {};
  private pageLevelAds = false;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private destroy$: DestroyService,
    private platform: PlatformService,
    private userAgentService: UserAgentService,
    private optionService: OptionService,
    private commonService: CommonService,
    private console: ConsoleService,
    private logService: LogService
  ) {
    this.isMobile = this.userAgentService.isMobile();
  }

  ngAfterViewInit(): void {
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => {
        this.options = options;
        const adsenseFlag = this.options['ads_flag'] || '';
        this.adsenseFlag =
          (env.production && ['1', '0'].includes(adsenseFlag)) || (!env.production && ['2', '0'].includes(adsenseFlag));

        this.initOptions();
        this.loadAdsense();
      });
  }

  ngOnDestroy(): void {
    const iframe = this.adsenseEle.nativeElement.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.src = 'about:blank';
      iframe.remove();
    }
  }

  logClick() {
    this.logService
      .logAction({
        action: ActionType.CLICK_ADSENSE,
        objectType: ActionObjectType.ADS,
        adsPosition: this.position,
        appId: APP_ID
      })
      .subscribe();
  }

  private initOptions() {
    const defaults: AdsenseConfig = {
      clientId: '',
      slotId: '',
      format: '',
      className: '',
      style: '',
      display: 'inline-block',
      testMode: false
    };
    let adsenseConfig: Partial<AdsenseConfig> = {};
    if (this.dynamic && this.optionKey) {
      try {
        adsenseConfig = JSON.parse(this.options[this.optionKey]);
      } catch (e) {}
    }
    adsenseConfig = {
      ...defaults,
      ...adsenseConfig
    };
    this.clientId = this.clientId ?? adsenseConfig.clientId;
    this.slotId = this.slotId ?? adsenseConfig.slotId;
    this.format = this.format ?? adsenseConfig.format;
    this.responsive = this.responsive ?? adsenseConfig.responsive;
    this.className = (this.className ?? adsenseConfig.className) + this.adsenseClass;
    this.className += this.isMobile ? ` ${this.customClassPrefix}-mobile` : ` ${this.customClassPrefix}-desktop`;
    this.className = uniq(this.className.split(' ')).join(' ');
    this.style = this.style ?? adsenseConfig.style;
    this.display = this.display ?? adsenseConfig.display;
    this.width = this.parseSize(this.width ?? adsenseConfig.width);
    this.height = this.parseSize(this.height ?? adsenseConfig.height);
    this.minWidth = this.parseSize(this.minWidth ?? adsenseConfig.minWidth);
    this.minHeight = this.parseSize(this.minHeight ?? adsenseConfig.minHeight);
    this.maxWidth = this.parseSize(this.maxWidth ?? adsenseConfig.maxWidth);
    this.maxHeight = this.parseSize(this.maxHeight ?? adsenseConfig.maxHeight);
    this.testMode = this.testMode ?? adsenseConfig.testMode;
    this.visible = !!(this.clientId && this.slotId);
  }

  private parseSize = (size: number | string): string => {
    return typeof size === 'number' ? size + 'px' : size;
  };

  private loadAdsense() {
    if (this.platform.isBrowser) {
      if (this.adsenseFlag && this.visible) {
        const ads: Record<string, string | boolean> = {};
        if (this.pageLevelAds) {
          ads['google_ad_client'] = this.clientId;
          ads['enable_page_level_ads'] = true;
        }
        if (window) {
          try {
            this.renderAdsense();
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push(ads);
            if (Array.isArray((window as any).adsbygoogle)) {
              this.console.warn('Ads is blocked.');
              this.hideAdsense();
            } else {
              this.commonService.updateAdsFlag(false);
            }
          } catch (e: any) {
            this.console.error('Ads: ', e.message || 'is not working.');
            this.hideAdsense();
          }
        }
      } else {
        this.console.warn('Ads is disabled.');
        this.hideAdsense();
      }
    }
  }

  private renderAdsense() {
    const adsEle = this.document.createElement('ins');

    adsEle.className = this.className;
    adsEle.setAttribute('style', this.style);
    adsEle.style.display = this.display;
    this.width && (adsEle.style.width = this.width + '');
    this.height && (adsEle.style.height = this.height + '');
    this.minWidth && (adsEle.style.minWidth = this.minWidth + '');
    this.minHeight && (adsEle.style.minHeight = this.minHeight + '');
    this.maxWidth && (adsEle.style.maxWidth = this.maxWidth + '');
    this.maxHeight && (adsEle.style.maxHeight = this.maxHeight + '');

    adsEle.setAttribute('data-ad-client', this.clientId);
    adsEle.setAttribute('data-ad-slot', this.slotId + '');
    adsEle.setAttribute('data-ad-region', this.region);
    this.format && adsEle.setAttribute('data-ad-format', this.format);
    this.testMode && adsEle.setAttribute('data-ad-adtest', 'on');
    if (typeof this.responsive === 'boolean') {
      adsEle.setAttribute('data-full-width-responsive', this.responsive + '');
    }

    this.adsenseEle.nativeElement.appendChild(adsEle);
  }

  private hideAdsense() {
    this.adsenseEle.nativeElement.style.display = 'none';
    this.commonService.updateAdsFlag(true);
  }
}
