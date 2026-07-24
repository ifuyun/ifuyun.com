import { Component, input, model, output } from '@angular/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { SigninFormComponent } from '../signin-form/signin-form.component';

@Component({
  selector: 'lib-signin-modal',
  imports: [NzModalModule, SigninFormComponent],
  templateUrl: './signin-modal.component.html',
  styleUrl: './signin-modal.component.less'
})
export class SigninModalComponent {
  readonly visible = model(true);
  readonly closable = input(true);
  readonly close = output<void>();

  closeModal() {
    if (!this.closable()) {
      return;
    }
    this.visible.set(false);
    this.close.emit();
  }
}
