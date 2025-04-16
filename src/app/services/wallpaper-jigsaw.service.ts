import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Wallpaper } from '../interfaces/wallpaper';

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
