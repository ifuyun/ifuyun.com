import { Injectable } from '@angular/core';
import { Wallpaper } from 'common/interfaces';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WallpaperJigsawService {
  private activeJigsawWallpaper: BehaviorSubject<Wallpaper | null> = new BehaviorSubject<Wallpaper | null>(null);
  public activeJigsawWallpaper$: Observable<Wallpaper | null> = this.activeJigsawWallpaper.asObservable();

  updateActiveJigsawWallpaper(wallpaper: Wallpaper) {
    this.activeJigsawWallpaper.next(wallpaper);
  }
}
