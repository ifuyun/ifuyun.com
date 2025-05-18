import { Inject, Injectable } from '@angular/core';
import { AppConfig, APP_CONFIG, AppDomainConfig } from './app-config.module';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  constructor(@Inject(APP_CONFIG) private config: AppConfig) {}

  get appConfig(): AppConfig {
    return this.config;
  }

  get isDev(): boolean {
    return this.config.isDev;
  }

  get apps(): AppDomainConfig {
    return this.config.apps;
  }

  get appId(): string {
    return this.config.appId;
  }

  get apiBase(): string {
    return this.config.apiBase;
  }

  get cookie() {
    return this.config.cookie;
  }

  get cookieDomain(): string {
    return this.config.cookie.domain;
  }

  get cookieExpires(): number {
    return this.config.cookie.expires;
  }

  get magazineUrl(): string {
    return this.config.magazineUrl;
  }
}
