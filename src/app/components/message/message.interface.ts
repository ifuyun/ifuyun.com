import { Direction } from '@angular/cdk/bidi';
import { Subject } from 'rxjs';

export type MessageType = 'success' | 'info' | 'warning' | 'error';

export interface MessageDataOptions {
  duration?: number;
  animate?: boolean;
  pauseOnHover?: boolean;
}

export interface MessageData {
  type: string;
  content: string;
  messageId?: string;
  createdAt?: Date;
  options?: MessageDataOptions;
  state?: 'enter' | 'leave';
  onClose?: Subject<boolean>;
}

export interface MessageConfig {
  animate?: boolean;
  duration?: number;
  maxStack?: number;
  pauseOnHover?: boolean;
  top?: number | string;
  direction?: Direction;
}

export type MessageRef = Pick<Required<MessageData>, 'onClose' | 'messageId'>;
