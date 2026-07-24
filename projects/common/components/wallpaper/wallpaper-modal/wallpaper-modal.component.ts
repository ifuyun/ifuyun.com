import { Component, computed, inject, input, OnChanges, output, signal } from '@angular/core';
import { AppConfigService, DestroyService } from 'common/core';
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
  private readonly destroy$ = inject(DestroyService);
  private readonly commonService = inject(CommonService);
  private readonly appConfigService = inject(AppConfigService);
  private readonly wallpaperService = inject(WallpaperService);

  readonly visible = input(false);
  readonly close = output<void>();

  readonly loading = signal(false);
  readonly wallpapers = signal<Wallpaper[]>([]);
  readonly activeIndex = signal(0);
  readonly activeWallpaper = computed(() => this.wallpapers()[this.activeIndex()]);

  private readonly domains = this.appConfigService.apps;

  ngOnChanges(): void {
    if (this.visible() && this.wallpapers().length < 1) {
      this.getWallpapers();
    }
  }

  prevWallpaper() {
    this.activeIndex.set(this.activeIndex() < 2 ? 0 : this.activeIndex() - 1);
  }

  nextWallpaper() {
    const size = this.wallpapers().length;

    this.activeIndex.set(this.activeIndex() > size - 2 ? size - 1 : this.activeIndex() + 1);
  }

  gotoDetail() {
    this.closeModal();
    this.commonService.smartNavigate('/detail/' + this.activeWallpaper().id, this.domains['wallpaper'].url, {
      queryParams: {
        lang: this.activeWallpaper().isCn ? null : 'en',
        ref: 'toolbox'
      }
    });
  }

  gotoSearch() {
    window.open(this.activeWallpaper().copyrightUrl);
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
    this.loading.set(true);

    this.wallpaperService
      .getRandomWallpapers(8)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.wallpapers.set(
          res.map((item) => {
            const loc = item.location ? '，' + item.location : ', ' + item.locationEn;
            const description = item.copyright + loc + ' (' + item.copyrightAuthor + ')';
            const enLink = item.copyrightUrlEn ? item.copyrightUrlEn + '&ensearch=1' : '';
            return {
              ...item,
              title: item.title || item.titleEn,
              copyrightUrl: `https://cn.bing.com${item.copyrightUrl || enLink}`,
              description: description
            };
          })
        );
        this.activeIndex.set(0);
        this.loading.set(false);
      });
  }
}
