import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentModule } from '../../components/component.module';
import { PipesModule } from '../../pipes/pipes.module';
import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent } from './login/login.component';
import { ThirdLoginComponent } from './third-login/third-login.component';

@NgModule({
  declarations: [LoginComponent, ThirdLoginComponent],
  imports: [CommonModule, LoginRoutingModule, ComponentModule, PipesModule, FormsModule, ReactiveFormsModule],
  exports: [LoginComponent, ThirdLoginComponent]
})
export class LoginModule {}
