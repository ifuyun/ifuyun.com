import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { EmptyComponent } from '../../../components/empty/empty.component';
import { UserAgentService } from '../../../core/user-agent.service';
import { WallpaperItemComponent } from '../wallpaper-item/wallpaper-item.component';
import { Wallpaper } from '../wallpaper.interface';

@Component({
  selector: 'i-wallpaper-list-view',
  standalone: true,
  imports: [CommonModule, WallpaperItemComponent, EmptyComponent],
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
