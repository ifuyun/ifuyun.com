import { DOCUMENT, NgIf, NgTemplateOutlet } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Renderer2,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { CLASS_BLOCK_SCROLL } from '../../config/common.constant';
import { PlatformService } from '../../core/platform.service';

@Component({
  selector: 'i-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.less'],
  standalone: true,
  imports: [NgIf, NgTemplateOutlet]
})
export class ModalComponent implements OnDestroy, AfterViewInit, OnChanges {
  @Input() content!: TemplateRef<void>;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() loading = false;
  @Input() showClose = true;

  @ViewChild('modal') modal!: ElementRef;
  @ViewChild('modalBody') modalBody!: ElementRef;

  imageUrl = '';
  imageTitle = '';
  isBrowser: boolean;

  private unlistenClick!: () => void;
  private unlistenInput!: () => void;
  private bodyEle!: ElementRef;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private platform: PlatformService
  ) {
    this.isBrowser = platform.isBrowser;
  }

  ngAfterViewInit(): void {
    if (this.platform.isBrowser) {
      this.bodyEle = this.renderer.selectRootElement('body', true);
      this.unlistenClick = this.renderer.listen(this.modal.nativeElement, 'click', (e: MouseEvent) => {
        let classNames = Array.from((e.target as HTMLElement).classList);
        if (classNames.length < 1) {
          // in case of: SVGPathElement
          classNames = Array.from(((e.target as HTMLElement).parentNode as HTMLElement).classList);
        }
        if (classNames.some((name) => ['modal', 'modal-close', 'icon-close'].includes(name))) {
          this.toggleModal(false);
        }
      });
      this.unlistenInput = this.renderer.listen(this.bodyEle, 'keyup', (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          this.toggleModal(false);
        }
      });
    }
  }

  ngOnChanges() {
    if (this.platform.isBrowser && this.content && this.visible) {
      this.toggleModal(true);
    }
  }

  ngOnDestroy() {
    this.unlistenClick && this.unlistenClick();
    this.unlistenInput && this.unlistenInput();
  }

  private toggleModal(visible: boolean) {
    const htmlNode = this.document.getElementsByTagName('html')[0];
    if (visible) {
      htmlNode.classList.add(CLASS_BLOCK_SCROLL);
    } else {
      htmlNode.classList.remove(CLASS_BLOCK_SCROLL);
      this.visibleChange.emit(false);
    }
  }
}
