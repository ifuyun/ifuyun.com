import {
  afterNextRender,
  Component,
  DOCUMENT,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  Output
} from '@angular/core';
import { AppConfigService } from 'common/core';
import { TurnstileOptions } from './turnstile.interface';

declare global {
  interface Window {
    onloadTurnstileCallback: () => void;
    turnstile: {
      render: (idOrContainer: string | HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetIdOrContainer: string | HTMLElement) => void;
      getResponse: (widgetIdOrContainer: string | HTMLElement) => string | undefined;
      remove: (widgetIdOrContainer: string | HTMLElement) => void;
    };
  }
}

@Component({
  selector: 'lib-turnstile',
  template: ``
})
export class TurnstileComponent implements OnDestroy {
  @Input() siteKey!: string;
  @Input() action?: string;
  @Input() cData?: string;
  @Input() theme?: 'light' | 'dark' | 'auto' = 'auto';
  @Input() language?: string = 'auto';
  @Input() tabIndex?: number;
  @Input() appearance?: 'always' | 'execute' | 'interaction-only' = 'always';
  @Input() retry?: 'never' | 'auto' = 'auto';
  @Input() size?: 'normal' | 'flexible' | 'compact' = 'normal';

  @Output() resolved = new EventEmitter<string | null>();
  @Output() errored = new EventEmitter<string | null>();

  private readonly turnstileUrl = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
  private readonly callbackName = 'onloadTurnstileCallback';
  private readonly scriptId = 'turnstileJs';

  private widgetId!: string;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly zone: NgZone,
    private readonly elementRef: ElementRef<HTMLElement>,
    private readonly appConfigService: AppConfigService
  ) {
    afterNextRender(() => this.createWidget());
  }

  public createWidget(): void {
    let turnstileOptions: TurnstileOptions = {
      sitekey: this.siteKey,
      theme: this.theme,
      language: this.language,
      tabindex: this.tabIndex,
      action: this.action,
      cData: this.cData,
      appearance: this.appearance,
      retry: this.retry,
      size: this.size,
      callback: (token: string) => {
        this.zone.run(() => this.resolved.emit(token));
      },
      'error-callback': (errorCode: string): boolean => {
        this.zone.run(() => this.errored.emit(errorCode));
        // Returning false causes Turnstile to log error code as a console warning.
        return !this.appConfigService.isDev;
      },
      'expired-callback': () => {
        this.zone.run(() => this.reset());
      }
    };

    window[this.callbackName] = () => {
      if (!this.elementRef?.nativeElement) {
        return;
      }

      this.widgetId = window.turnstile.render(this.elementRef.nativeElement, turnstileOptions);
    };

    if (this.scriptLoaded()) {
      window[this.callbackName]();
      return;
    }

    const script = this.document.createElement('script');
    script.src = `${this.turnstileUrl}?render=explicit&onload=${this.callbackName}`;
    script.id = this.scriptId;
    script.async = true;
    script.defer = true;
    this.document.head.appendChild(script);
  }

  public reset(): void {
    if (this.widgetId) {
      this.resolved.emit(null);
      window.turnstile.reset(this.widgetId);
    }
  }

  public ngOnDestroy(): void {
    if (this.widgetId) {
      window.turnstile.remove(this.widgetId);
    }
  }

  public scriptLoaded(): boolean {
    return !!this.document.getElementById(this.scriptId);
  }
}
