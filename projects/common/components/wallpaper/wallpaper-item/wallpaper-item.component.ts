import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { AppConfigService, AppDomainConfig, UserAgentService } from 'common/core';
import { ListMode, WallpaperLang } from 'common/enums';
import { Wallpaper } from 'common/interfaces';
import { NumberViewPipe } from 'common/pipes';
import { WallpaperService } from 'common/services';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { SmartLinkComponent } from '../../smart-link/smart-link.component';

@Component({
  selector: 'lib-wallpaper-item',
  imports: [RouterLink, NzIconModule, DatePipe, NumberViewPipe, SmartLinkComponent],
  templateUrl: './wallpaper-item.component.html',
  styleUrls: ['../../post/post-item/post-item.component.less', './wallpaper-item.component.less']
})
export class WallpaperItemComponent implements OnInit {
  @Input() wallpaper!: Wallpaper;
  @Input() lang?: WallpaperLang;
  @Input() mode!: ListMode;
  @Input() index!: number;
  @Input() jigsaw = false;

  isMobile = false;
  domains!: AppDomainConfig;

  get linkPrefix() {
    const domain = this.jigsaw ? this.domains['jigsaw'].url : this.domains['wallpaper'].url;

    return domain + '/detail/';
  }

  get wallpaperLocation() {
    return this.wallpaper.isCn ? this.wallpaper.wallpaperLocation : this.wallpaper.wallpaperLocationEn;
  }

  constructor(
    private readonly userAgentService: UserAgentService,
    private readonly appConfigService: AppConfigService,
    private readonly wallpaperService: WallpaperService
  ) {
    this.isMobile = this.userAgentService.isMobile;
    this.domains = this.appConfigService.apps;
  }

  ngOnInit(): void {
    if (!this.wallpaper.isCn && !this.wallpaper.isEn) {
      this.wallpaper = this.wallpaperService.transformWallpaper(this.wallpaper);
    }
  }

  getLangParams(isCn: boolean): Params {
    if (this.jigsaw) {
      return {};
    }
    if (!this.lang) {
      return isCn ? {} : { lang: WallpaperLang.EN };
    }
    return { lang: this.lang };
  }
}
