import { DatePipe, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ListMode } from '../../enums/common';
import { WallpaperLang } from '../../enums/wallpaper';
import { Wallpaper } from '../../interfaces/wallpaper';
import { NumberViewPipe } from '../../pipes/number-view.pipe';
import { UserAgentService } from '../../services/user-agent.service';

@Component({
  selector: 'app-wallpaper-item',
  imports: [NgIf, RouterLink, NzIconModule, DatePipe, NumberViewPipe],
  templateUrl: './wallpaper-item.component.html',
  styleUrls: ['../post-item/post-item.component.less', './wallpaper-item.component.less']
})
export class WallpaperItemComponent {
  @Input() wallpaper!: Wallpaper;
  @Input() lang?: WallpaperLang;
  @Input() mode!: ListMode;
  @Input() index!: number;

  isMobile = false;

  get wallpaperLocation() {
    return this.wallpaper.isCn ? this.wallpaper.wallpaperLocation : this.wallpaper.wallpaperLocationEn;
  }

  constructor(private readonly userAgentService: UserAgentService) {
    this.isMobile = this.userAgentService.isMobile;
  }

  getLangParams(isCn: boolean): Params {
    if (!this.lang) {
      return isCn ? {} : { lang: WallpaperLang.EN };
    }
    return { lang: this.lang };
  }
}
