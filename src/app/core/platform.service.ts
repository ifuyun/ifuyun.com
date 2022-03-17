import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PlatformService {
  isBrowser: boolean = this.platformId ? isPlatformBrowser(this.platformId) : typeof document === 'object' && !!document;
  isServer: boolean = !this.isBrowser;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
  }
}
