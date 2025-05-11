import { DatePipe, NgIf } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Params } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { DomainLink } from 'src/app/directives/domain-link';
import { ListMode } from 'src/app/enums/common';
import { WallpaperLang } from 'src/app/enums/wallpaper';
import { Wallpaper } from 'src/app/interfaces/wallpaper';
import { NumberViewPipe } from 'src/app/pipes/number-view.pipe';
import { UserAgentService } from 'src/app/services/user-agent.service';
import { WallpaperService } from 'src/app/services/wallpaper.service';

@Component({
  selector: 'app-wallpaper-item',
  imports: [NgIf, NzIconModule, DatePipe, NumberViewPipe, DomainLink],
  templateUrl: './wallpaper-item.component.html',
  styleUrls: ['../post-item/post-item.component.less', './wallpaper-item.component.less']
})
export class WallpaperItemComponent implements OnInit {
  @Input() wallpaper!: Wallpaper;
  @Input() lang?: WallpaperLang;
  @Input() mode!: ListMode;
  @Input() index!: number;
  @Input() jigsaw = false;

  isMobile = false;

  get linkPrefix() {
    return this.jigsaw ? '/jigsaw/' : '/wallpaper/';
  }

  get wallpaperLocation() {
    return this.wallpaper.isCn ? this.wallpaper.wallpaperLocation : this.wallpaper.wallpaperLocationEn;
  }

  constructor(
    private readonly userAgentService: UserAgentService,
    private readonly wallpaperService: WallpaperService
  ) {
    this.isMobile = this.userAgentService.isMobile;
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
