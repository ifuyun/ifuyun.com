import { Overlay } from '@angular/cdk/overlay';
import { Injectable, Injector } from '@angular/core';
import { SingletonService } from '../../core/singleton.service';
import { MessageBaseService } from './base';
import { MessageContainerComponent } from './message-container.component';
import { MessageData, MessageDataOptions } from './message.interface';

@Injectable({
  providedIn: 'root'
})
export class MessageService extends MessageBaseService {
  protected override container!: MessageContainerComponent;
  protected componentKey = 'message';

  constructor(nzSingletonService: SingletonService, overlay: Overlay, injector: Injector) {
    super(nzSingletonService, overlay, injector);
  }

  success(content: string, options?: MessageDataOptions) {
    this.addMessage({ type: 'success', content }, options);
  }

  error(content: string, options?: MessageDataOptions) {
    this.addMessage({ type: 'error', content }, options);
  }

  warning(content: string, options?: MessageDataOptions) {
    this.addMessage({ type: 'warning', content }, options);
  }

  info(content: string, options?: MessageDataOptions) {
    this.addMessage({ type: 'info', content }, options);
  }

  private addMessage(message: MessageData, options?: MessageDataOptions) {
    this.container = this.withContainer(MessageContainerComponent);
    return this.container.create({
      ...message,
      createdAt: new Date(),
      messageId: this.getMessageId(),
      options
    });
  }
}
