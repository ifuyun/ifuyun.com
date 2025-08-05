import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppConfigService } from 'common/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzQRCodeModule } from 'ng-zorro-antd/qr-code';

@Component({
  selector: 'lib-share-modal',
  imports: [NzModalModule, NzQRCodeModule],
  templateUrl: './share-modal.component.html',
  styleUrl: './share-modal.component.less'
})
export class ShareModalComponent {
  @Input() visible = true;
  @Input() shareUrl = '';
  @Output() close = new EventEmitter();

  readonly faviconUrl: string;

  constructor(private readonly appConfigService: AppConfigService) {
    this.faviconUrl = appConfigService.faviconUrl;
  }

  closeModal() {
    this.close.emit();
  }
}
