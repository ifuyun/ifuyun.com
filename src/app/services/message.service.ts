import { Injectable, TemplateRef } from '@angular/core';
import { NzMessageDataOptions, NzMessageRef, NzMessageService } from 'ng-zorro-antd/message';
import { PlatformService } from './platform.service';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  constructor(
    private readonly platform: PlatformService,
    private readonly message: NzMessageService
  ) {}

  success(content: string | TemplateRef<void>, options?: NzMessageDataOptions): NzMessageRef | void {
    if (this.platform.isBrowser) {
      return this.message.success(content, options);
    }
  }

  error(content: string | TemplateRef<void>, options?: NzMessageDataOptions): NzMessageRef | void {
    if (this.platform.isBrowser) {
      return this.message.error(content, options);
    }
  }

  info(content: string | TemplateRef<void>, options?: NzMessageDataOptions): NzMessageRef | void {
    if (this.platform.isBrowser) {
      return this.message.info(content, options);
    }
  }

  warning(content: string | TemplateRef<void>, options?: NzMessageDataOptions): NzMessageRef | void {
    if (this.platform.isBrowser) {
      return this.message.warning(content, options);
    }
  }

  loading(content: string | TemplateRef<void>, options?: NzMessageDataOptions): NzMessageRef | void {
    if (this.platform.isBrowser) {
      return this.message.loading(content, options);
    }
  }

  create(
    type: 'success' | 'info' | 'warning' | 'error' | 'loading' | string,
    content: string | TemplateRef<void>,
    options?: NzMessageDataOptions
  ): NzMessageRef | void {
    if (this.platform.isBrowser) {
      return this.message.create(type, content, options);
    }
  }
}
