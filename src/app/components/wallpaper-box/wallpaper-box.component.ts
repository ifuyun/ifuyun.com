import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BING_DOMAIN, DEFAULT_WALLPAPER_RESOLUTION } from '../../config/constants';
import { PlatformService } from '../../core/platform.service';
import { Wallpaper } from '../../pages/wallpaper/wallpaper.interface';
import { WallpaperService } from '../../pages/wallpaper/wallpaper.service';

@Component({
  selector: 'i-wallpaper-box',
  templateUrl: './wallpaper-box.component.html',
  styleUrls: ['./wallpaper-box.component.less']
})
export class WallpaperBoxComponent implements OnDestroy, OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  loading = false;
  wallpapers: Wallpaper[] = [];
  activeWallpaper!: Wallpaper;
  activeIndex = 0;
  isBrowser: boolean;

  private wallpaperListener!: Subscription;

  constructor(private wallpaperService: WallpaperService, private platform: PlatformService, private router: Router) {
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

  gotoWallpaper() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.router.navigate(['/wallpaper']);
  }

  private fetchData() {
    this.loading = true;
    this.wallpaperListener = this.wallpaperService.getRandomWallpapers(8).subscribe((res) => {
      this.wallpapers = res.map((item) => ({
        ...item,
        fullUrl: `${BING_DOMAIN}${item.urlBase}_${DEFAULT_WALLPAPER_RESOLUTION}.${item.imageFormat}`,
        fullCopyrightUrl: `${BING_DOMAIN}${item.copyrightLink}`
      }));
      this.resetImage();
      this.loading = false;
    });
  }

  private resetImage() {
    this.activeIndex = 0;
    this.activeWallpaper = this.wallpapers[this.activeIndex];
  }
}
