import { CommonModule } from '@angular/common';
import { InjectionToken, ModuleWithProviders, NgModule } from '@angular/core';

export interface AppDomainConfig {
  [name: string]: { port: number; url: string };
}
export interface AppConfig {
  isDev: boolean;
  apps: AppDomainConfig;
  appId: string;
  apiBase: string;
  cookie: {
    domain: string;
    expires: number;
  };
  magazineUrl: string;
  emulator?: {
    basePath: string;
    loaderPath: string;
  };
}

export const APP_CONFIG = new InjectionToken<AppConfig>('common.config');

@NgModule({
  imports: [CommonModule]
})
export class AppConfigModule {
  static forRoot(config: AppConfig): ModuleWithProviders<AppConfigModule> {
    return {
      ngModule: AppConfigModule,
      providers: [{ provide: APP_CONFIG, useValue: config }]
    };
  }
}
