import { AnimationEvent } from '@angular/animations';
import { ComponentType, Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ChangeDetectorRef, Directive, EventEmitter, Injector, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { PlatformService } from '../../core/platform.service';
import { SingletonService } from '../../core/singleton.service';
import { MessageConfig, MessageData, MessageDataOptions } from './message.interface';

let globalCounter = 0;

export abstract class MessageBaseService {
  protected container!: MessageContainerBaseComponent;
  protected abstract componentKey: string;

  constructor(private singleton: SingletonService, private overlay: Overlay, private injector: Injector) {}

  remove(id?: string): void {
    if (this.container) {
      if (id) {
        this.container.remove(id);
      } else {
        this.container.removeAll();
      }
    }
  }

  protected withContainer<T extends MessageContainerBaseComponent>(ct: ComponentType<T>): T {
    let containerInstance = this.singleton.getSingleton(this.componentKey);
    if (containerInstance) {
      return containerInstance;
    }
    const overlayRef = this.overlay.create({
      hasBackdrop: false,
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      positionStrategy: this.overlay.position().global()
    });
    const componentPortal = new ComponentPortal(ct, null, this.injector);
    const componentRef = overlayRef.attach(componentPortal);

    this.container = containerInstance = componentRef.instance;
    this.singleton.registerSingleton(this.componentKey, containerInstance);

    return containerInstance;
  }

  protected getMessageId() {
    return `${this.componentKey}-${globalCounter++}`;
  }
}

@Directive()
export abstract class MessageContainerBaseComponent implements OnDestroy {
  config?: Required<MessageConfig>;
  messages: Array<Required<MessageData>> = [];

  protected readonly destroy$ = new Subject<void>();

  constructor(protected cdr: ChangeDetectorRef) {
    this.updateConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  create(data: MessageData): Required<MessageData> {
    const instance = this.onCreate(data);

    if (this.config && this.messages.length >= this.config.maxStack) {
      this.messages = this.messages.slice(1);
    }

    this.messages = [...this.messages, instance];

    this.readyInstances();

    return instance;
  }

  remove(id: string, userAction = false): void {
    this.messages.some((instance, index) => {
      if (instance.messageId === id) {
        this.messages.splice(index, 1);
        this.messages = [...this.messages];
        this.onRemove(instance, userAction);
        this.readyInstances();
        return true;
      }
      return false;
    });
  }

  removeAll(): void {
    this.messages.forEach((i) => this.onRemove(i, false));
    this.messages = [];

    this.readyInstances();
  }

  protected onCreate(instance: MessageData): Required<MessageData> {
    instance.options = this.mergeOptions(instance.options);
    instance.onClose = new Subject<boolean>();
    return instance as Required<MessageData>;
  }

  protected onRemove(instance: Required<MessageData>, userAction: boolean): void {
    instance.onClose.next(userAction);
    instance.onClose.complete();
  }

  protected readyInstances(): void {
    this.cdr.detectChanges();
  }

  protected abstract updateConfig(): void;

  protected mergeOptions(options?: MessageDataOptions): MessageDataOptions {
    const { duration, animate, pauseOnHover } = this.config || {};
    return { duration, animate, pauseOnHover, ...options };
  }
}

@Directive()
export abstract class MessageBaseComponent implements OnInit, OnDestroy {
  message!: Required<MessageData>;
  index?: number;

  readonly destroyed = new EventEmitter<{ id: string; userAction: boolean }>();
  readonly animationStateChanged: Subject<AnimationEvent> = new Subject<AnimationEvent>();

  protected options!: Required<MessageDataOptions>;
  protected autoClose?: boolean;
  protected closeTimer!: NodeJS.Timeout | null;
  protected userAction = false;
  protected eraseTimer: NodeJS.Timeout | null = null;
  protected eraseTimingStart?: number;
  protected eraseTTL!: number;

  protected constructor(protected cdr: ChangeDetectorRef, protected platform: PlatformService) {}

  ngOnInit(): void {
    this.options = this.message.options as Required<MessageDataOptions>;

    if (this.options.animate) {
      this.message.state = 'enter';
      this.animationStateChanged
        .pipe(
          filter((event) => event.phaseName === 'done' && event.toState === 'leave'),
          take(1)
        )
        .subscribe(() => {
          this.closeTimer && clearTimeout(this.closeTimer);
          this.destroyed.next({ id: this.message.messageId, userAction: this.userAction });
        });
    }

    this.autoClose = this.platform.isServer || this.options.duration > 0;

    if (this.autoClose) {
      this.initErase();
      this.startEraseTimeout();
    }
  }

  ngOnDestroy(): void {
    if (this.autoClose) {
      this.clearEraseTimeout();
    }
    this.animationStateChanged.complete();
  }

  onEnter(): void {
    if (this.autoClose && this.options.pauseOnHover) {
      this.clearEraseTimeout();
      this.updateTTL();
    }
  }

  onLeave(): void {
    if (this.autoClose && this.options.pauseOnHover) {
      this.startEraseTimeout();
    }
  }

  protected destroy(userAction = false): void {
    this.userAction = userAction;
    if (this.options.animate) {
      this.message.state = 'leave';
      this.cdr.detectChanges();
      this.closeTimer = setTimeout(() => {
        this.closeTimer = null;
        this.destroyed.next({ id: this.message.messageId, userAction });
      }, 200);
    } else {
      this.destroyed.next({ id: this.message.messageId, userAction });
    }
  }

  private initErase(): void {
    this.eraseTTL = this.options.duration;
    this.eraseTimingStart = Date.now();
  }

  private updateTTL(): void {
    if (this.autoClose && this.eraseTimingStart) {
      this.eraseTTL -= Date.now() - this.eraseTimingStart;
    }
  }

  private startEraseTimeout(): void {
    if (this.platform.isBrowser && this.eraseTTL > 0) {
      this.clearEraseTimeout();
      this.eraseTimer = setTimeout(() => this.destroy(), this.eraseTTL);
      this.eraseTimingStart = Date.now();
    } else {
      this.destroy();
    }
  }

  private clearEraseTimeout(): void {
    if (this.eraseTimer !== null) {
      clearTimeout(this.eraseTimer);
      this.eraseTimer = null;
    }
  }
}

export function toCssPixel(value: number | string): string {
  if (value == null) {
    return '';
  }

  return typeof value === 'string' ? value : `${value}px`;
}
