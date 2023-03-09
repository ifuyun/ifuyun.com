import { CommonModule, DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, Input, OnDestroy, ViewChild } from '@angular/core';
import { isEmpty } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
import { environment as env } from '../../../environments/environment';
import { CommonService } from '../../core/common.service';
import { DestroyService } from '../../core/destroy.service';
import { PlatformService } from '../../core/platform.service';
import { UserAgentService } from '../../core/user-agent.service';
import { OptionEntity } from '../../interfaces/option.interface';
import { OptionService } from '../../services/option.service';
import { AdsenseConfig } from './adsense.interface';

@Component({
  selector: 'i-adsense',
  standalone: true,
  imports: [CommonModule],
  providers: [DestroyService],
  template: `
    <div #adsense class="ads-wrap" [class.ads-wrap-desktop]="!isMobile" [class.ads-wrap-mobile]="isMobile"></div>
  `,
  styleUrls: []
})
export class AdsenseComponent implements AfterViewInit, OnDestroy {
  @ViewChild('adsense', { read: ElementRef, static: true }) adsenseEle!: ElementRef;

  @Input() dynamic = true;
  @Input() optionKey = '';
  // full options
  @Input() clientId!: string;
  @Input() slotId!: string | number;
  @Input() format!: string;
  @Input() responsive!: boolean;
  @Input() className!: string;
  @Input() display!: string;
  @Input() width!: number | string;
  @Input() height!: number | string;
  @Input() region = 'ad-' + Math.floor(Math.random() * 10000) + 1;
  @Input() testMode!: boolean;

  isMobile = false;
  visible = false;

  private isDev = !env.production;
  private options: OptionEntity = {};
  private pageLevelAds = false;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private destroy$: DestroyService,
    private platform: PlatformService,
    private userAgentService: UserAgentService,
    private optionService: OptionService,
    private commonService: CommonService
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
        this.initOptions();
        this.loadAds();
      });
  }

  ngOnDestroy(): void {
    const iframe = this.adsenseEle.nativeElement.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.src = 'about:blank';
      iframe.remove();
    }
  }

  private initOptions() {
    const defaults: AdsenseConfig = {
      clientId: '',
      slotId: '',
      format: '',
      responsive: false,
      className: 'adsbygoogle',
      display: 'inline-block',
      testMode: this.isDev
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
    this.className = this.className ?? adsenseConfig.className;
    this.display = this.display ?? adsenseConfig.display;
    this.width = this.width ?? adsenseConfig.width;
    if (this.width) {
      this.width = typeof this.width === 'number' ? this.width + 'px' : this.width;
    }
    this.height = this.height ?? adsenseConfig.height;
    if (this.height) {
      this.height = typeof this.height === 'number' ? this.height + 'px' : this.height;
    }
    this.testMode = this.testMode ?? adsenseConfig.testMode;
    this.visible = !!(this.clientId && this.slotId);
  }

  private loadAds() {
    if (!this.isDev && this.platform.isBrowser && this.visible) {
      const ads: Record<string, string | boolean> = {};
      if (this.pageLevelAds) {
        ads['google_ad_client'] = this.clientId;
        ads['enable_page_level_ads'] = true;
      }
      if (window) {
        try {
          this.createAdsEle();
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push(ads);
          if (Array.isArray((window as any).adsbygoogle)) {
            this.hideAdsEle();
            this.commonService.updateAdsFlag(true);
          } else {
            this.commonService.updateAdsFlag(false);
          }
        } catch (e) {
          this.hideAdsEle();
        }
      }
    } else {
      this.hideAdsEle();
    }
  }

  private createAdsEle() {
    const adsEle = this.document.createElement('ins');
    adsEle.className = this.className;
    adsEle.style.display = this.display;
    adsEle.style.width = this.width + '';
    adsEle.style.height = this.height + '';
    adsEle.setAttribute('data-ad-client', this.clientId);
    adsEle.setAttribute('data-ad-slot', this.slotId + '');
    adsEle.setAttribute('data-ad-region', this.region);
    if (this.format) {
      adsEle.setAttribute('data-ad-format', this.format);
    }
    if (this.responsive) {
      adsEle.setAttribute('data-full-width-responsive', 'true');
    }
    if (this.testMode) {
      adsEle.setAttribute('data-ad-adtest', 'on');
    }

    this.adsenseEle.nativeElement.appendChild(adsEle);
  }

  private hideAdsEle() {
    this.adsenseEle.nativeElement.style.display = 'none';
  }
}
