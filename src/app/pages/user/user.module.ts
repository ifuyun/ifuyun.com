import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AutofocusDirective } from '../../directives/autofocus.directive';
import { NgZorroAntdModule } from '../../modules/antd/ng-zorro-antd.module';
import { UserRoutingModule } from './user-routing.module';
import { LoginComponent } from './login/login.component';
import { ThirdLoginComponent } from './third-login/third-login.component';
import { RegisterComponent } from './register/register.component';

@NgModule({
  imports: [CommonModule, UserRoutingModule, FormsModule, ReactiveFormsModule, NgZorroAntdModule, AutofocusDirective],
  declarations: [LoginComponent, ThirdLoginComponent, RegisterComponent],
  exports: [LoginComponent, ThirdLoginComponent]
})
export class UserModule {}
