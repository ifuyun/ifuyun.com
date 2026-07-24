import { Component, inject, input, output } from '@angular/core';
import { AppConfigService } from 'common/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzQRCodeModule } from 'ng-zorro-antd/qr-code';

@Component({
  selector: 'lib-share-modal',
  imports: [NzModalModule, NzQRCodeModule],
  templateUrl: './share-modal.component.html'
})
export class ShareModalComponent {
  private readonly appConfigService = inject(AppConfigService);

  readonly visible = input(true);
  readonly shareUrl = input('');
  readonly close = output<void>();

  readonly faviconUrl = this.appConfigService.faviconUrl;

  closeModal() {
    this.close.emit();
  }
}
