import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from '../config/api-url';
import { ApiService } from '../core/api.service';
import { Wallpaper, WallpaperQueryParam } from '../interfaces/common';

@Injectable({
  providedIn: 'root'
})
export class UtilService {
  constructor(private apiService: ApiService) {}

  getWallpapers(param: Partial<WallpaperQueryParam>): Observable<Wallpaper[]> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_WALLPAPERS), param)
      .pipe(map((res) => res?.data || []));
  }
}
