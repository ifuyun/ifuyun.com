import { Direction } from '@angular/cdk/bidi';

export interface ImageConfig {
  nzFallback?: string;
  nzPlaceholder?: string;
  nzDisablePreview?: string;
  nzCloseOnNavigation?: boolean;
  nzDirection?: Direction;
}
