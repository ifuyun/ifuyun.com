import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { takeUntil } from 'rxjs';
import { Wallpaper } from 'src/app/interfaces/wallpaper';
import { DestroyService } from 'src/app/services/destroy.service';
import { UserAgentService } from 'src/app/services/user-agent.service';
import { WallpaperService } from 'src/app/services/wallpaper.service';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  providers: [DestroyService],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.less'
})
export class AuthLayoutComponent implements OnInit {
  isMobile = false;
  bgWallpaper?: Wallpaper;

  private fromRouter = false;

  constructor(
    private readonly destroy$: DestroyService,
    private readonly route: ActivatedRoute,
    private readonly userAgentService: UserAgentService,
    private readonly wallpaperService: WallpaperService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngOnInit(): void {
    const { bg } = this.route.firstChild?.snapshot.data || {};
    if (bg !== false) {
      this.getWallpaper();
    }
  }

  private getWallpaper() {
    this.wallpaperService
      .getRandomWallpapers(1, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.bgWallpaper = res[0];
      });
  }
}
