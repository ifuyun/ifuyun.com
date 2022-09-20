import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { PlatformService } from '../../core/platform.service';
import { Wallpaper } from '../../interfaces/common';
import { UtilService } from '../../services/util.service';

@Component({
  selector: 'i-wallpaper',
  templateUrl: './wallpaper.component.html',
  styleUrls: ['./wallpaper.component.less']
})
export class WallpaperComponent implements OnDestroy, OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  loading = false;
  wallpapers: Wallpaper[] = [];
  activeWallpaper!: Wallpaper;
  activeIndex = 0;
  isBrowser: boolean;

  private wallpaperListener!: Subscription;

  constructor(private utilService: UtilService, private platform: PlatformService) {
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

  ngOnDestroy() {
    this.wallpaperListener?.unsubscribe();
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

  private fetchData() {
    this.loading = true;
    this.wallpaperListener = this.utilService.getWallpapers({ size: 8 }).subscribe((res) => {
      this.wallpapers = res;
      this.resetImage();
      this.loading = false;
    });
  }

  private resetImage() {
    this.activeIndex = 0;
    this.activeWallpaper = this.wallpapers[this.activeIndex];
  }
}
