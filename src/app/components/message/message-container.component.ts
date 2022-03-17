import { Direction } from '@angular/cdk/bidi';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { MessageContainerBaseComponent, toCssPixel } from './base';
import { MessageConfig } from './message.interface';

const MESSAGE_DEFAULT_CONFIG: Required<MessageConfig> = {
  animate: true,
  duration: 3000,
  maxStack: 7,
  pauseOnHover: true,
  top: 24,
  direction: 'ltr'
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  selector: 'message-container',
  exportAs: 'messageContainer',
  preserveWhitespaces: false,
  template: `
    <div class="message" [class.message-rtl]="dir === 'rtl'" [style.top]="top">
      <message
        *ngFor="let message of messages"
        [message]="message"
        (destroyed)="remove($event.id, $event.userAction)"
      ></message>
    </div>
  `
})
export class MessageContainerComponent extends MessageContainerBaseComponent {
  dir: Direction = 'ltr';
  top?: string | null;

  constructor(cdr: ChangeDetectorRef) {
    super(cdr);
  }

  protected updateConfig(): void {
    this.config = {
      ...MESSAGE_DEFAULT_CONFIG,
      ...this.config,
    };

    this.top = toCssPixel(this.config.top);
    this.cdr.markForCheck();
  }
}
