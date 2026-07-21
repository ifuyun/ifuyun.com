import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { SigninFormComponent } from '../signin-form/signin-form.component';

@Component({
  selector: 'lib-signin-modal',
  imports: [NzModalModule, SigninFormComponent],
  templateUrl: './signin-modal.component.html',
  styleUrl: './signin-modal.component.less'
})
export class SigninModalComponent {
  @Input() visible = true;
  @Input() closable = true;
  @Output() close = new EventEmitter();

  closeModal() {
    if (!this.closable) {
      return;
    }
    this.visible = false;
    this.close.emit();
  }
}
