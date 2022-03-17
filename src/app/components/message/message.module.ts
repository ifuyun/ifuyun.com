import { BidiModule } from '@angular/cdk/bidi';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MessageContainerComponent } from './message-container.component';
import { MessageComponent } from './message.component';

@NgModule({
  imports: [
    BidiModule,
    CommonModule,
    OverlayModule
  ],
  declarations: [MessageContainerComponent, MessageComponent],
  entryComponents: [MessageContainerComponent]
})
export class MessageModule {
}
