import { Component, Input } from '@angular/core';
import { UserAgentService } from '../../../core/user-agent.service';
import { Wallpaper } from '../wallpaper.interface';

@Component({
  selector: 'i-wallpaper-list-view',
  templateUrl: './wallpaper-list-view.component.html',
  styleUrls: []
})
export class WallpaperListViewComponent {
  @Input() wallpapers: Wallpaper[] = [];

  isMobile = false;

  constructor(private userAgentService: UserAgentService) {
    this.isMobile = this.userAgentService.isMobile();
  }
}
