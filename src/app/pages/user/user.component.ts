import { Observable } from 'rxjs';
import { PageComponent } from '../../core/page.component';
import { Wallpaper } from '../wallpaper/wallpaper.interface';
import { WallpaperService } from '../wallpaper/wallpaper.service';

export abstract class UserComponent extends PageComponent {
  abstract wallpaper: Wallpaper | null;

  constructor(
    protected document: Document,
    protected wallpaperService: WallpaperService
  ) {
    super();
  }

  protected fetchWallpaper(): Observable<Wallpaper[]> {
    return this.wallpaperService.getRandomWallpapers({
      size: 1
    });
  }

  protected transformWallpaper(wallpapers: Wallpaper[], urlPrefix: string): Wallpaper[] {
    return wallpapers.map((wallpaper) => ({
      ...wallpaper,
      wallpaperUrl: `${urlPrefix}${wallpaper.wallpaperUrl}`
    }));
  }

  protected initStyles() {
    this.document.body.classList.add('bg-image');
    this.document.body.style.backgroundImage = `url('${this.wallpaper?.wallpaperUrl}')`;
  }

  protected clearStyles() {
    this.document.body.classList.remove('bg-image');
    this.document.body.style.backgroundImage = '';
  }
}
