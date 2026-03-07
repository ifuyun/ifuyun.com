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

export interface TurnstileOptions {
  sitekey: string;
  action?: string;
  cData?: string;
  callback?: (token: string) => void;
  'error-callback'?: (errorCode: string) => boolean;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  tabindex?: number;
  appearance?: 'always' | 'execute' | 'interaction-only';
  retry?: 'never' | 'auto';
  size?: 'normal' | 'flexible' | 'compact';
}

export {};
