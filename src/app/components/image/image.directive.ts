import { Direction, Directionality } from '@angular/cdk/bidi';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectorRef,
  Directive,
  ElementRef,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  SimpleChanges
} from '@angular/core';
import { fromEvent, Subject, takeUntil } from 'rxjs';
import { InputBoolean } from '../antd-core/util';

import { ImageGroupComponent } from './image-group.component';
import { ImageService } from './image.service';

export type ImageStatusType = 'error' | 'loading' | 'normal';

@Directive({
  selector: 'img[i-image]',
  exportAs: 'nzImage',
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    '(click)': 'onPreview()'
  },
  standalone: true
})
export class ImageDirective implements OnInit, OnChanges, OnDestroy {
  @Input() nzSrc = '';
  @Input() nzSrcset = '';
  @Input() @InputBoolean() nzDisablePreview = false;
  @Input() nzFallback: string | null = null;
  @Input() nzPlaceholder: string | null = null;

  dir?: Direction;
  backLoadImage!: HTMLImageElement;
  status: ImageStatusType = 'normal';
  private backLoadDestroy$: Subject<void> = new Subject();
  private destroy$: Subject<void> = new Subject();

  get previewable(): boolean {
    return !this.nzDisablePreview && this.status !== 'error';
  }

  constructor(
    @Inject(DOCUMENT) private document: any,
    private elementRef: ElementRef,
    private imageService: ImageService,
    protected cdr: ChangeDetectorRef,
    @Optional() private parentGroup: ImageGroupComponent,
    @Optional() private directionality: Directionality
  ) {}

  ngOnInit(): void {
    this.backLoad();
    if (this.parentGroup) {
      this.parentGroup.addImage(this);
    }
    if (this.directionality) {
      this.directionality.change?.pipe(takeUntil(this.destroy$)).subscribe((direction: Direction) => {
        this.dir = direction;
        this.cdr.detectChanges();
      });
      this.dir = this.directionality.value;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPreview(): void {
    if (!this.previewable) {
      return;
    }

    if (this.parentGroup) {
      // preview inside image group
      const previewAbleImages = this.parentGroup.images.filter((e) => e.previewable);
      const previewImages = previewAbleImages.map((e) => ({ src: e.nzSrc, srcset: e.nzSrcset }));
      const previewIndex = previewAbleImages.findIndex((el) => this === el);
      const previewRef = this.imageService.preview(previewImages, { nzDirection: this.dir });
      previewRef.switchTo(previewIndex);
    } else {
      // preview not inside image group
      const previewImages = [{ src: this.nzSrc, srcset: this.nzSrcset }];
      this.imageService.preview(previewImages, { nzDirection: this.dir });
    }
  }

  getElement(): ElementRef<HTMLImageElement> {
    return this.elementRef;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { nzSrc } = changes;
    if (nzSrc) {
      this.getElement().nativeElement.src = nzSrc.currentValue;
      this.backLoad();
    }
  }

  /**
   * use internal Image object handle fallback & placeholder
   *
   * @private
   */
  private backLoad(): void {
    this.backLoadImage = this.document.createElement('img');
    this.backLoadImage.src = this.nzSrc;
    this.backLoadImage.srcset = this.nzSrcset;
    this.status = 'loading';

    // unsubscribe last backLoad
    this.backLoadDestroy$.next();
    this.backLoadDestroy$.complete();
    this.backLoadDestroy$ = new Subject();
    if (this.backLoadImage.complete) {
      this.status = 'normal';
      this.getElement().nativeElement.src = this.nzSrc;
      this.getElement().nativeElement.srcset = this.nzSrcset;
    } else {
      if (this.nzPlaceholder) {
        this.getElement().nativeElement.src = this.nzPlaceholder;
        this.getElement().nativeElement.srcset = '';
      } else {
        this.getElement().nativeElement.src = this.nzSrc;
        this.getElement().nativeElement.srcset = this.nzSrcset;
      }

      // The `i-image` directive can be destroyed before the `load` or `error` event is dispatched,
      // so there's no sense to keep capturing `this`.
      fromEvent(this.backLoadImage, 'load')
        .pipe(takeUntil(this.backLoadDestroy$), takeUntil(this.destroy$))
        .subscribe(() => {
          this.status = 'normal';
          this.getElement().nativeElement.src = this.nzSrc;
          this.getElement().nativeElement.srcset = this.nzSrcset;
        });

      fromEvent(this.backLoadImage, 'error')
        .pipe(takeUntil(this.backLoadDestroy$), takeUntil(this.destroy$))
        .subscribe(() => {
          this.status = 'error';
          if (this.nzFallback) {
            this.getElement().nativeElement.src = this.nzFallback;
            this.getElement().nativeElement.srcset = '';
          }
        });
    }
  }
}
