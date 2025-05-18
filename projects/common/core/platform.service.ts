import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PlatformService {
  readonly isBrowser: boolean = true;
  readonly isServer: boolean = false;

  constructor(@Inject(PLATFORM_ID) private readonly platformId: any) {
    this.isBrowser = this.platformId ? isPlatformBrowser(this.platformId) : typeof document === 'object' && !!document;
    this.isServer = !this.isBrowser;
  }
}
