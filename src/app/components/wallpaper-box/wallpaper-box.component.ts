import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs';
import { DestroyService } from '../../core/destroy.service';
import { PlatformService } from '../../core/platform.service';
import { BING_DOMAIN } from '../../pages/wallpaper/wallpaper.constant';
import { Wallpaper } from '../../pages/wallpaper/wallpaper.interface';
import { WallpaperService } from '../../pages/wallpaper/wallpaper.service';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'i-wallpaper-box',
  templateUrl: './wallpaper-box.component.html',
  styleUrls: ['./wallpaper-box.component.less'],
  standalone: true,
  imports: [CommonModule, ModalComponent],
  providers: [DestroyService]
})
export class WallpaperBoxComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  loading = false;
  wallpapers: Wallpaper[] = [];
  activeWallpaper!: Wallpaper;
  activeIndex = 0;
  isBrowser: boolean;

  constructor(
    private destroy$: DestroyService,
    private wallpaperService: WallpaperService,
    private platform: PlatformService,
    private router: Router
  ) {
    this.isBrowser = platform.isBrowser;
  }

  ngOnChanges(changes: SimpleChanges) {
    const { visible } = changes;
    if (visible && this.visible) {
      this.resetImage();
    }
    if (this.visible && this.wallpapers.length < 1) {
      this.fetchData();
    }
  }

  changeVisible(visible: boolean) {
    this.visibleChange.emit(visible);
  }

  prevImage() {
    if (this.wallpapers.length < 1) {
      return;
    }
    this.activeIndex = this.activeIndex < 2 ? 0 : this.activeIndex - 1;
    this.activeWallpaper = this.wallpapers[this.activeIndex];
  }

  nextImage() {
    if (this.wallpapers.length < 1) {
      return;
    }
    const size = Math.min(this.wallpapers.length, 8);
    this.activeIndex = this.activeIndex > size - 2 ? size - 1 : this.activeIndex + 1;
    this.activeWallpaper = this.wallpapers[this.activeIndex];
  }

  gotoWallpaper() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.router.navigate(['/wallpaper'], { queryParams: { ref: 'toolbox' } });
  }

  private fetchData() {
    this.loading = true;
    this.wallpaperService
      .getRandomWallpapers({
        size: 8
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.wallpapers = res.map((item) => {
          const loc = item.wallpaperLocation ? '，' + item.wallpaperLocation : ', ' + item.wallpaperLocationEn;
          const description =
            (item.wallpaperCopyright || item.wallpaperCopyrightEn) + loc + ' (' + item.wallpaperCopyrightAuthor + ')';
          const enLink = item.wallpaperCopyrightLinkEn ? item.wallpaperCopyrightLinkEn + '&ensearch=1' : '';
          return {
            ...item,
            wallpaperTitle: item.wallpaperTitle || item.wallpaperTitleEn,
            wallpaperCopyrightLink: `${BING_DOMAIN}${item.wallpaperCopyrightLink || enLink}`,
            wallpaperDescription: description
          };
        });
        this.resetImage();
        this.loading = false;
      });
  }

  private resetImage() {
    this.activeIndex = 0;
    this.activeWallpaper = this.wallpapers[this.activeIndex];
  }
}
