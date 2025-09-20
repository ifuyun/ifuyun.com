import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { LoginFormComponent } from '../login-form/login-form.component';

@Component({
  selector: 'lib-login-modal',
  imports: [NzModalModule, LoginFormComponent],
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.less'
})
export class LoginModalComponent {
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
