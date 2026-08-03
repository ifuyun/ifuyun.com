import { Component, inject, input, model, OnInit, output } from '@angular/core';
import { Wallpaper } from 'common/interfaces';
import { WallpaperJigsawService } from 'common/services';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { JigsawComponent } from '../jigsaw/jigsaw.component';

@Component({
  selector: 'lib-jigsaw-modal',
  imports: [NzModalModule, JigsawComponent],
  templateUrl: './jigsaw-modal.html',
  styleUrl: './jigsaw-modal.less'
})
export class JigsawModal implements OnInit {
  private readonly wallpaperJigsawService = inject(WallpaperJigsawService);

  readonly wallpaper = input.required<Wallpaper>();
  readonly visible = model(true);
  readonly close = output<void>();

  ngOnInit(): void {
    this.wallpaperJigsawService.updateActiveJigsawWallpaper(this.wallpaper());
  }

  closeModal() {
    this.visible.set(false);
    this.close.emit();
  }
}
