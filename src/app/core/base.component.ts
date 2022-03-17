import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Response } from 'express';

export abstract class BaseComponent {
  protected abstract platform: Object;
  protected abstract response: Response;

  protected isPlatformServer(): boolean {
    return isPlatformServer(this.platform);
  }

  protected isPlatformBrowser(): boolean {
    return isPlatformBrowser(this.platform);
  }

  protected setStatus(code: number): void {
    this.response.status(code);
  }
}
