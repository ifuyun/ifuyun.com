import { BidiModule } from '@angular/cdk/bidi';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ImageGroupComponent } from './image-group.component';
import { ImagePreviewComponent } from './image-preview.component';
import { ImageDirective } from './image.directive';
import { ImageService } from './image.service';

@NgModule({
  imports: [BidiModule, OverlayModule, PortalModule, DragDropModule, CommonModule],
  exports: [ImageDirective, ImagePreviewComponent, ImageGroupComponent],
  providers: [ImageService],
  declarations: [ImageDirective, ImagePreviewComponent, ImageGroupComponent]
})
export class ImageModule {}
