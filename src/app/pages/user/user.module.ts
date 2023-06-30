import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AutofocusDirective } from '../../directives/autofocus.directive';
import { UserRoutingModule } from './user-routing.module';
import { LoginComponent } from './login/login.component';
import { ThirdLoginComponent } from './third-login/third-login.component';

@NgModule({
  imports: [CommonModule, UserRoutingModule, FormsModule, ReactiveFormsModule, AutofocusDirective],
  declarations: [LoginComponent, ThirdLoginComponent],
  exports: [LoginComponent, ThirdLoginComponent]
})
export class UserModule {}
