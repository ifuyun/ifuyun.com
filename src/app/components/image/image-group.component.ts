import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

import { ImageDirective } from './image.directive';

@Component({
  selector: 'nz-image-group',
  exportAs: 'nzImageGroup',
  template: '<ng-content></ng-content>',
  preserveWhitespaces: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ImageGroupComponent {
  images: ImageDirective[] = [];

  addImage(image: ImageDirective): void {
    this.images.push(image);
  }
}
