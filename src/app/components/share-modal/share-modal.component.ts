import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzQRCodeModule } from 'ng-zorro-antd/qr-code';

@Component({
  selector: 'app-share-modal',
  imports: [NgIf, NzModalModule, NzQRCodeModule],
  templateUrl: './share-modal.component.html',
  styleUrl: './share-modal.component.less'
})
export class ShareModalComponent {
  @Input() shareUrl = '';
  @Output() closeModal = new EventEmitter();

  onClose() {
    this.closeModal.emit();
  }
}
