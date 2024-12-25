import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { LoginFormComponent } from '../login-form/login-form.component';

@Component({
  selector: 'app-login-modal',
  imports: [NzModalModule, LoginFormComponent],
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.less'
})
export class LoginModalComponent {
  @Input() visible = true;
  @Output() close = new EventEmitter();

  closeModal() {
    this.close.emit();
  }
}
