import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Router } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { takeUntil } from 'rxjs';
import { Wallpaper } from 'src/app/interfaces/wallpaper';
import { DestroyService } from 'src/app/services/destroy.service';
import { WallpaperService } from 'src/app/services/wallpaper.service';

@Component({
  selector: 'app-wallpaper-modal',
  imports: [NzModalModule, NzIconModule],
  providers: [DestroyService],
  templateUrl: './wallpaper-modal.component.html',
  styleUrl: './wallpaper-modal.component.less'
})
export class WallpaperModalComponent implements OnChanges {
  @Input() visible = false;
  @Output() close = new EventEmitter();

  loading = false;
  wallpapers: Wallpaper[] = [];
  activeIndex = 0;

  get activeWallpaper() {
    return this.wallpapers[this.activeIndex];
  }

  constructor(
    private readonly router: Router,
    private readonly destroy$: DestroyService,
    private readonly wallpaperService: WallpaperService
  ) {}

  ngOnChanges(): void {
    if (this.visible && this.wallpapers.length < 1) {
      this.getWallpapers();
    }
  }

  prevWallpaper() {
    this.activeIndex = this.activeIndex < 2 ? 0 : this.activeIndex - 1;
  }

  nextWallpaper() {
    const size = this.wallpapers.length;

    this.activeIndex = this.activeIndex > size - 2 ? size - 1 : this.activeIndex + 1;
  }

  gotoDetail() {
    this.closeModal();
    this.router.navigate(['/wallpaper/' + this.activeWallpaper.wallpaperId], {
      queryParams: {
        lang: this.activeWallpaper.isCn ? null : 'en',
        ref: 'toolbox'
      }
    });
  }

  gotoSearch() {
    window.open(this.activeWallpaper.wallpaperCopyrightLink);
  }

  gotoWallpaper() {
    this.closeModal();
    this.router.navigate(['/wallpaper'], { queryParams: { ref: 'toolbox' } });
  }

  closeModal() {
    this.close.emit();
  }

  private getWallpapers() {
    this.loading = true;
    this.wallpaperService
      .getRandomWallpapers(8)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.wallpapers = res.map((item) => {
          const loc = item.wallpaperLocation ? '，' + item.wallpaperLocation : ', ' + item.wallpaperLocationEn;
          const description = item.wallpaperCopyright + loc + ' (' + item.wallpaperCopyrightAuthor + ')';
          const enLink = item.wallpaperCopyrightLinkEn ? item.wallpaperCopyrightLinkEn + '&ensearch=1' : '';
          return {
            ...item,
            wallpaperTitle: item.wallpaperTitle || item.wallpaperTitleEn,
            wallpaperCopyrightLink: `https://cn.bing.com${item.wallpaperCopyrightLink || enLink}`,
            wallpaperDescription: description
          };
        });
        this.activeIndex = 0;
        this.loading = false;
      });
  }
}
