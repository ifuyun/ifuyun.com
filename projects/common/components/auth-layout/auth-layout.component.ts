import { Component, inject, OnInit, signal } from '@angular/core';
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
  private readonly destroy$ = inject(DestroyService);
  private readonly route = inject(ActivatedRoute);
  private readonly uaService = inject(UserAgentService);
  private readonly wallpaperService = inject(WallpaperService);

  readonly isMobile = this.uaService.isMobile;
  readonly bgWallpaper = signal<Wallpaper | null>(null);

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
        this.bgWallpaper.set(res[0]);
      });
  }
}
