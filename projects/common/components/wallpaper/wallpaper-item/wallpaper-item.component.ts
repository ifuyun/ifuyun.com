import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, model, OnInit } from '@angular/core';
import { Params } from '@angular/router';
import { AppConfigService, UserAgentService } from 'common/core';
import { ListMode, WallpaperLang } from 'common/enums';
import { IconCalendarDateComponent, IconChatSquareComponent, IconChatSquareDotsComponent } from 'common/icons';
import { Wallpaper } from 'common/interfaces';
import { NumberViewPipe } from 'common/pipes';
import { WallpaperService } from 'common/services';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { SmartLinkComponent } from '../../smart-link/smart-link.component';

@Component({
  selector: 'lib-wallpaper-item',
  imports: [
    NzIconModule,
    DatePipe,
    NumberViewPipe,
    SmartLinkComponent,
    IconCalendarDateComponent,
    IconChatSquareDotsComponent,
    IconChatSquareComponent
  ],
  templateUrl: './wallpaper-item.component.html',
  styleUrls: ['../../post/post-item/post-item.component.less', './wallpaper-item.component.less']
})
export class WallpaperItemComponent implements OnInit {
  private readonly uaService = inject(UserAgentService);
  private readonly appConfigService = inject(AppConfigService);
  private readonly wallpaperService = inject(WallpaperService);

  readonly wallpaper = model.required<Wallpaper>();
  readonly lang = input(WallpaperLang.CN);
  readonly mode = input(ListMode.CARD);
  readonly index = input.required<number>();
  readonly jigsaw = input(false);

  readonly isMobile = this.uaService.isMobile;
  readonly domains = this.appConfigService.apps;

  readonly linkPrefix = computed(() => {
    const domain = this.jigsaw() ? this.domains['jigsaw'].url : this.domains['wallpaper'].url;

    return domain + '/detail/';
  });
  readonly wallpaperLocation = computed(() => {
    const wallpaper = this.wallpaper();

    return wallpaper.isCn ? wallpaper.location : wallpaper.locationEn;
  });

  ngOnInit(): void {
    const wallpaper = this.wallpaper();

    if (!wallpaper.isCn && !wallpaper.isEn) {
      this.wallpaper.set(this.wallpaperService.transformWallpaper(wallpaper));
    }
  }

  getLangParams(isCn: boolean): Params {
    if (this.jigsaw()) {
      return {};
    }
    if (!this.lang()) {
      return isCn ? {} : { lang: WallpaperLang.EN };
    }
    return { lang: this.lang() };
  }
}
