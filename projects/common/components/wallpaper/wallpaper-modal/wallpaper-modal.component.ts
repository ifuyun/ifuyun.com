import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { AppConfigService, AppDomainConfig, DestroyService } from 'common/core';
import { Wallpaper } from 'common/interfaces';
import { CommonService, WallpaperService } from 'common/services';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'lib-wallpaper-modal',
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

  private domains!: AppDomainConfig;

  get activeWallpaper() {
    return this.wallpapers[this.activeIndex];
  }

  constructor(
    private readonly destroy$: DestroyService,
    private readonly commonService: CommonService,
    private readonly appConfigService: AppConfigService,
    private readonly wallpaperService: WallpaperService
  ) {
    this.domains = this.appConfigService.apps;
  }

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
    this.commonService.smartNavigate('/detail/' + this.activeWallpaper.wallpaperId, this.domains['wallpaper'].url, {
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
    this.commonService.smartNavigate('/list', this.domains['wallpaper'].url, {
      queryParams: {
        ref: 'toolbox'
      }
    });
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
