import { Direction } from '@angular/cdk/bidi';

export class ImagePreviewOptions {
  nzKeyboard?: boolean = true;
  nzNoAnimation?: boolean = false;
  nzMaskClosable?: boolean = true;
  nzCloseOnNavigation?: boolean = true;
  nzZIndex?: number;
  nzZoom?: number;
  nzRotate?: number;
  nzDirection?: Direction;
}

export interface Image {
  src: string;
  srcset?: string;
  alt?: string;
  width?: string | number;
  height?: string | number;
  padding?: number;
  borderRadius?: number;
}
