import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { Subscription } from 'rxjs';
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

  private wallpaperListener!: Subscription;

  constructor(private utilService: UtilService) {}

  ngOnChanges() {
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
      this.activeWallpaper = this.wallpapers[0];
      this.loading = false;
    });
  }
}
