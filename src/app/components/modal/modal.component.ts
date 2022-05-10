import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.less']
})
export class ModalComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input('imgEle') imgEle!: HTMLImageElement | string;
  @Input('padding') padding: number = 0;
  @Output() toggleModal = new EventEmitter<boolean>();

  @ViewChild('modal') modal!: ElementRef;
  @ViewChild('modalBody') modalBody!: ElementRef;

  private unlistenClick!: Function;
  private unlistenInput!: Function;
  private bodyEle!: ElementRef;

  constructor(
    private renderer: Renderer2
  ) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.bodyEle = this.renderer.selectRootElement('body', true);
    this.unlistenClick = this.renderer.listen(this.modal.nativeElement, 'click', (e: MouseEvent) => {
      let classNames = Array.from((e.target as HTMLElement).classList);
      if (classNames.length < 1) {
        // in case of: SVGPathElement
        classNames = Array.from(((e.target as HTMLElement).parentNode as HTMLElement).classList);
      }
      if (classNames.some((name) => ['modal-mask', 'modal-container', 'modal-close', 'icon-close'].includes(name))) {
        this.hideModal();
      }
    });
    this.unlistenInput = this.renderer.listen(this.bodyEle, 'keyup', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.hideModal();
      }
    });
    this.renderer.setStyle(this.bodyEle, 'overflow', 'hidden');
    if (this.padding > 0) {
      this.modalBody.nativeElement.setAttribute('style', `padding: ${this.padding}px; background-color:#fff;`);
    }

    if (this.imgEle) {
      let imgNode: HTMLImageElement;
      if (typeof this.imgEle === 'string') {
        imgNode = this.renderer.createElement('img');
        imgNode.src = this.imgEle;
      } else {
        imgNode = <HTMLImageElement>this.imgEle.cloneNode(true);
        this.renderer.removeAttribute(imgNode, 'width');
        this.renderer.removeAttribute(imgNode, 'id');
      }
      this.renderer.setStyle(imgNode, 'max-width', '100%');
      this.renderer.appendChild(this.modalBody.nativeElement, imgNode);
    }
  }

  ngOnDestroy() {
    this.unlistenClick();
    this.unlistenInput();
  }

  private hideModal() {
    this.toggleModal.emit(false);
    this.renderer.removeStyle(this.bodyEle, 'overflow');
  }
}
