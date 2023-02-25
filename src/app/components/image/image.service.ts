import { Directionality } from '@angular/cdk/bidi';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Injectable, Injector, Optional } from '@angular/core';

import { IMAGE_PREVIEW_MASK_CLASS_NAME } from './image-config';
import { Image, ImagePreviewOptions } from './image-preview-options';
import { NzImagePreviewRef } from './image-preview-ref';
import { ImagePreviewComponent } from './image-preview.component';

export interface ImageService {
  preview(images: Image[], option?: ImagePreviewOptions): NzImagePreviewRef;
}

@Injectable()
export class ImageService {
  constructor(
    private overlay: Overlay,
    private injector: Injector,
    @Optional() private directionality: Directionality
  ) {}

  preview(images: Image[], options?: ImagePreviewOptions): NzImagePreviewRef {
    return this.display(images, options);
  }

  private display(images: Image[], config?: ImagePreviewOptions): NzImagePreviewRef {
    const configMerged = { ...new ImagePreviewOptions(), ...(config ?? {}) };
    const overlayRef = this.createOverlay(configMerged);
    const previewComponent = this.attachPreviewComponent(overlayRef, configMerged);
    previewComponent.setImages(images);
    const previewRef = new NzImagePreviewRef(previewComponent, configMerged, overlayRef);

    previewComponent.previewRef = previewRef;
    return previewRef;
  }

  private attachPreviewComponent(overlayRef: OverlayRef, config: ImagePreviewOptions): ImagePreviewComponent {
    const injector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: OverlayRef, useValue: overlayRef },
        { provide: ImagePreviewOptions, useValue: config }
      ]
    });

    const containerPortal = new ComponentPortal(ImagePreviewComponent, null, injector);
    const containerRef = overlayRef.attach(containerPortal);

    return containerRef.instance;
  }

  private createOverlay(config: ImagePreviewOptions): OverlayRef {
    const overLayConfig = new OverlayConfig({
      hasBackdrop: true,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy: this.overlay.position().global(),
      disposeOnNavigation: config.nzCloseOnNavigation ?? true,
      backdropClass: IMAGE_PREVIEW_MASK_CLASS_NAME,
      direction: config.nzDirection || this.directionality.value
    });

    return this.overlay.create(overLayConfig);
  }
}
