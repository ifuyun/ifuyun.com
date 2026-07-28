import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  input,
  model,
  OnDestroy,
  signal,
  viewChild
} from '@angular/core';
import { AppConfigService, DestroyService, OptionEntity, PlatformService, UserAgentService } from 'common/core';
import { AdsenseOptions } from 'common/interfaces';
import { AdsService, AdsStatus, OptionService } from 'common/services';
import { isEmpty, uniq } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'lib-adsense',
  imports: [],
  providers: [DestroyService],
  templateUrl: './adsense.component.html'
})
export class AdsenseComponent implements AfterViewInit, OnDestroy {
  private readonly destroy$ = inject(DestroyService);
  private readonly platform = inject(PlatformService);
  private readonly uaService = inject(UserAgentService);
  private readonly appConfigService = inject(AppConfigService);
  private readonly optionService = inject(OptionService);
  private readonly adsService = inject(AdsService);

  readonly adsenseEle = viewChild<ElementRef, ElementRef>('adsense', { read: ElementRef });

  readonly dynamic = input<boolean>(true);
  readonly optionKey = input<string>('');
  readonly placeholder = input<boolean>(false);
  readonly text = input<string>('');
  readonly wrapClass = input<string>('');
  // full options
  readonly clientId = model<string>();
  readonly slotId = model<string | number>();
  readonly format = model<string>();
  readonly responsive = model<boolean>();
  readonly className = model<string>();
  readonly style = model<string>();
  readonly display = model<string>('block');
  readonly width = model<number | string>();
  readonly height = model<number | string>();
  readonly minWidth = model<number | string>();
  readonly minHeight = model<number | string>();
  readonly maxWidth = model<number | string>();
  readonly maxHeight = model<number | string>();
  readonly region = model<string>('ad-' + Math.floor(Math.random() * 10000) + 1);
  readonly testMode = model<boolean>(false);

  private readonly adsenseClass = 'adsbygoogle';
  private readonly customClass = 'ads-ins';
  private readonly options = signal<OptionEntity>({});
  // 开关配置
  private readonly adsFlag = signal(false);
  // 是否配置 clientId 和 slotId
  private readonly isValid = signal(false);
  private readonly pageLevelAds = signal(false);

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
        this.options.set(options);

        const isDev = this.appConfigService.isDev;
        const adsFlag = options['ads_flag'] || '';

        this.adsFlag.set((!isDev && ['1', '0'].includes(adsFlag)) || (isDev && ['2', '0'].includes(adsFlag)));

        this.initOptions();
        this.initAdsense();
      });
    this.adsService.adsStatus$.pipe(takeUntil(this.destroy$)).subscribe((status) => {
      if (status !== AdsStatus.ENABLED && status !== AdsStatus.UNKNOWN) {
        this.hideAdsense();
      }
    });
  }

  ngOnDestroy(): void {
    const iframe = this.adsenseEle()?.nativeElement.querySelector('iframe');
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
      display: 'block',
      region: 'ad-' + Math.floor(Math.random() * 10000) + 1,
      testMode: false
    };
    let adsenseOptions: Partial<AdsenseOptions> = {};
    if (this.dynamic() && this.optionKey()) {
      try {
        adsenseOptions = JSON.parse(this.options()[this.optionKey()]);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {}
    }
    adsenseOptions = {
      ...defaults,
      ...adsenseOptions
    };

    this.clientId.set(this.clientId() ?? adsenseOptions.clientId);
    this.slotId.set(this.slotId() ?? adsenseOptions.slotId);
    this.format.set(this.format() ?? adsenseOptions.format);
    this.responsive.set(this.responsive() ?? adsenseOptions.responsive);
    this.style.set(this.style() ?? adsenseOptions.style);
    this.display.set(this.display() ?? adsenseOptions.display);
    this.width.set(this.parseSize(this.width() ?? adsenseOptions.width!));
    this.height.set(this.parseSize(this.height() ?? adsenseOptions.height!));
    this.minWidth.set(this.parseSize(this.minWidth() ?? adsenseOptions.minWidth!));
    this.minHeight.set(this.parseSize(this.minHeight() ?? adsenseOptions.minHeight!));
    this.maxWidth.set(this.parseSize(this.maxWidth() ?? adsenseOptions.maxWidth!));
    this.maxHeight.set(this.parseSize(this.maxHeight() ?? adsenseOptions.maxHeight!));
    this.testMode.set(this.testMode() ?? adsenseOptions.testMode);
    this.isValid.set(!!(this.clientId() && this.slotId()));

    const className = [
      this.adsenseClass,
      this.className(),
      adsenseOptions.className,
      this.uaService.isMobile ? `m-${this.customClass}` : `p-${this.customClass}`
    ];
    this.className.set(uniq(className.filter((item) => !!item)).join(' '));
  }

  private initAdsense() {
    if (this.platform.isBrowser) {
      if (this.adsFlag() && this.isValid()) {
        const ads: Record<string, string | boolean> = {};
        if (this.pageLevelAds()) {
          ads['google_ad_client'] = this.clientId()!;
          ads['enable_page_level_ads'] = true;
        }
        try {
          this.renderAdsense();

          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push(ads);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e: any) {
          this.adsService.updateAdsStatus(AdsStatus.ERROR);
        }
      } else {
        this.adsService.updateAdsStatus(AdsStatus.DISABLED);
      }
    }
  }

  private renderAdsense() {
    const adsenseEle = this.adsenseEle();
    if (!adsenseEle) {
      return;
    }
    const adsBodyEle = document.createElement('ins');

    adsBodyEle.className = this.className()!;
    adsBodyEle.setAttribute('style', this.style()!);
    adsBodyEle.style.display = this.display();

    if (
      this.width() &&
      (!this.placeholder() || (this.placeholder() && this.width() !== '0' && this.width() !== '0px'))
    ) {
      adsBodyEle.style.width = this.width() + '';
    }
    if (
      this.height() &&
      (!this.placeholder() || (this.placeholder() && this.height() !== '0' && this.height() !== '0px'))
    ) {
      adsBodyEle.style.height = this.height() + '';
    }
    if (this.minWidth()) {
      adsBodyEle.style.minWidth = this.minWidth() + '';
    }
    if (this.minHeight()) {
      adsBodyEle.style.minHeight = this.minHeight() + '';
    }
    if (this.maxWidth()) {
      adsBodyEle.style.maxWidth = this.maxWidth() + '';
    }
    if (this.maxHeight()) {
      adsBodyEle.style.maxHeight = this.maxHeight() + '';
    }

    adsBodyEle.setAttribute('data-ad-client', this.clientId()!);
    adsBodyEle.setAttribute('data-ad-slot', this.slotId() + '');
    adsBodyEle.setAttribute('data-ad-region', this.region());
    if (this.format()) {
      adsBodyEle.setAttribute('data-ad-format', this.format()!);
    }
    if (this.testMode()) {
      adsBodyEle.setAttribute('data-ad-adtest', 'on');
    }
    if (typeof this.responsive() === 'boolean') {
      adsBodyEle.setAttribute('data-full-width-responsive', this.responsive() + '');
    }

    const adsEle = adsenseEle.nativeElement;
    if (this.wrapClass()) {
      adsEle.classList.add(this.wrapClass());
    }
    adsEle.classList.remove('ads-border');
    adsEle.appendChild(adsBodyEle);
  }

  private hideAdsense() {
    const adsenseEle = this.adsenseEle();
    // placeholder 为 true 时，显示占位内容
    if (!this.placeholder() && adsenseEle) {
      adsenseEle.nativeElement.style.display = 'none';
    }
  }

  private parseSize(size: number | string): string {
    return typeof size === 'number' ? (size ? size + 'px' : '0') : size;
  }
}
