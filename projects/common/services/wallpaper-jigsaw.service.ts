import { Injectable } from '@angular/core';
import { Wallpaper } from 'common/interfaces';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WallpaperJigsawService {
  private activeWallpaper: BehaviorSubject<Wallpaper | null> = new BehaviorSubject<Wallpaper | null>(null);
  public activeWallpaper$: Observable<Wallpaper | null> = this.activeWallpaper.asObservable();

  updateActiveWallpaper(wallpaper: Wallpaper) {
    this.activeWallpaper.next(wallpaper);
  }
}
