import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { DestroyService, UserAgentService } from 'common/core';
import { Wallpaper } from 'common/interfaces';
import { WallpaperService } from 'common/services';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'lib-auth-layout',
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
