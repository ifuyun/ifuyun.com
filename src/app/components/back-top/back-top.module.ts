import { BidiModule } from '@angular/cdk/bidi';
import { PlatformModule } from '@angular/cdk/platform';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackTopComponent } from './back-top.component';

@NgModule({
  imports: [BidiModule, CommonModule, PlatformModule],
  declarations: [BackTopComponent],
  exports: [BackTopComponent]
})
export class BackTopModule {}
