import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Renderer2,
  SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'i-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.less']
})
export class ModalComponent implements OnDestroy, AfterViewInit, OnChanges {
  @Input() template!: string | HTMLImageElement | TemplateRef<any>;
  @Input() padding = 0;
  @Input() margin = 0;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() loading = false;
  @Input() showClose = true;

  @ViewChild('modal') modal!: ElementRef;
  @ViewChild('modalBody') modalBody!: ElementRef;

  imageUrl = '';
  imageTitle = '';
  templateRef: TemplateRef<any> | null = null;

  private unlistenClick!: () => void;
  private unlistenInput!: () => void;
  private bodyEle!: ElementRef;

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    this.bodyEle = this.renderer.selectRootElement('body', true);
    this.unlistenClick = this.renderer.listen(this.modal.nativeElement, 'click', (e: MouseEvent) => {
      let classNames = Array.from((e.target as HTMLElement).classList);
      if (classNames.length < 1) {
        // in case of: SVGPathElement
        classNames = Array.from(((e.target as HTMLElement).parentNode as HTMLElement).classList);
      }
      if (classNames.some((name) => ['modal', 'modal-close', 'icon-close'].includes(name))) {
        this.hideModal();
      }
    });
    this.unlistenInput = this.renderer.listen(this.bodyEle, 'keyup', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.hideModal();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.visible && this.template) {
      this.renderModal();
    }
  }

  ngOnDestroy() {
    this.unlistenClick();
    this.unlistenInput();
  }

  private renderModal() {
    this.renderer.setStyle(this.bodyEle, 'overflow', 'hidden');
    if (typeof this.template === 'string') {
      this.imageUrl = this.template;
    } else if (this.template instanceof HTMLImageElement) {
      this.imageUrl = this.template.src;
      this.imageTitle = this.template.alt;
    } else {
      this.templateRef = this.template;
    }
  }

  private hideModal() {
    this.resetStyles();
    this.visibleChange.emit(false);
  }

  private resetStyles() {
    this.renderer.removeStyle(this.bodyEle, 'overflow');
  }
}
