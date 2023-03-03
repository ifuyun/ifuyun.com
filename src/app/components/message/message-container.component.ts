import { Direction } from '@angular/cdk/bidi';
import { NgFor } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { MessageContainerBaseComponent, toCssPixel } from './base';
import { MessageComponent } from './message.component';
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
  selector: 'i-message-container',
  exportAs: 'messageContainer',
  preserveWhitespaces: false,
  template: `
    <div class="message" [class.message-rtl]="dir === 'rtl'" [style.top]="top">
      <i-message
        *ngFor="let message of messages"
        [message]="message"
        (destroyed)="remove($event.id, $event.userAction)"
      ></i-message>
    </div>
  `,
  standalone: true,
  imports: [NgFor, MessageComponent]
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
      ...this.config
    };

    this.top = toCssPixel(this.config.top);
    this.cdr.markForCheck();
  }
}
