import { Direction, Directionality } from '@angular/cdk/bidi';
import { normalizePassiveListenerOptions, Platform } from '@angular/cdk/platform';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { fromEvent, Subject, Subscription } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { fadeMotion } from '../antd-core/animation';
import { DestroyService } from '../../core/destroy.service';
import { InputNumber } from '../antd-core/util';
import { ScrollService } from './scroll';

const passiveEventListenerOptions = normalizePassiveListenerOptions({ passive: true });

@Component({
  selector: 'i-back-top',
  template: `
    <div #backTop class="back-top" [class.back-top-rtl]="dir === 'rtl'" @fadeMotion *ngIf="visible">
      <ng-template #defaultContent>
        <div class="back-top-content">
          <div class="back-top-icon">
            <i class="icon icon-vertical-align-top"></i>
          </div>
        </div>
      </ng-template>
      <ng-template [ngTemplateOutlet]="nzTemplate || defaultContent"></ng-template>
    </div>
  `,
  styleUrls: ['./back-top.component.less'],
  animations: [fadeMotion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false,
  providers: [DestroyService]
})
export class BackTopComponent implements OnInit, OnDestroy, OnChanges {
  private scrollListenerDestroy$ = new Subject();
  private target: HTMLElement | null = null;

  visible = false;
  dir: Direction = 'ltr';

  @Input() nzTemplate?: TemplateRef<void>;
  @Input() @InputNumber() nzVisibilityHeight = 400;
  @Input() nzTarget?: string | HTMLElement;
  @Input() @InputNumber() nzDuration = 450;
  @Output() readonly nzClick: EventEmitter<boolean> = new EventEmitter();

  @ViewChild('backTop', { static: false })
  set backTop(backTop: ElementRef<HTMLElement> | undefined) {
    if (backTop) {
      this.backTopClickSubscription.unsubscribe();

      this.backTopClickSubscription = this.zone.runOutsideAngular(() => {
        return fromEvent(backTop.nativeElement, 'click')
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.scrollSrv.scrollTo(this.getTarget(), 0, { duration: this.nzDuration });
            // todo: replace with api: isObserved
            if (this.nzClick.observers.length) {
              this.zone.run(() => this.nzClick.emit(true));
            }
          });
      });
    }
  }

  private backTopClickSubscription = Subscription.EMPTY;

  constructor(
    @Inject(DOCUMENT) private doc: any,
    private scrollSrv: ScrollService,
    private platform: Platform,
    private cd: ChangeDetectorRef,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private destroy$: DestroyService,
    @Optional() private directionality: Directionality
  ) {
    this.dir = this.directionality.value;
  }

  ngOnInit(): void {
    this.registerScrollEvent();

    this.directionality.change?.pipe(takeUntil(this.destroy$)).subscribe((direction: Direction) => {
      this.dir = direction;
      this.cdr.detectChanges();
    });

    this.dir = this.directionality.value;
  }

  private getTarget(): HTMLElement | Window {
    return this.target || window;
  }

  private handleScroll(): void {
    if (this.visible === this.scrollSrv.getScroll(this.getTarget()) > this.nzVisibilityHeight) {
      return;
    }
    this.visible = !this.visible;
    this.cd.detectChanges();
  }

  private registerScrollEvent(): void {
    if (!this.platform.isBrowser) {
      return;
    }
    this.scrollListenerDestroy$.next(null);
    this.handleScroll();
    this.zone.runOutsideAngular(() => {
      fromEvent(this.getTarget(), 'scroll', <AddEventListenerOptions>passiveEventListenerOptions)
        .pipe(debounceTime(50), takeUntil(this.scrollListenerDestroy$))
        .subscribe(() => this.handleScroll());
    });
  }

  ngOnDestroy(): void {
    this.scrollListenerDestroy$.next(null);
    this.scrollListenerDestroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { nzTarget } = changes;
    if (nzTarget) {
      this.target = typeof this.nzTarget === 'string' ? this.doc.querySelector(this.nzTarget) : this.nzTarget;
      this.registerScrollEvent();
    }
  }
}
