import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from '../config/api-url';
import { ApiService } from '../core/api.service';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  constructor(
    private apiService: ApiService
  ) {
  }

  addFavorite(postId: string): Observable<boolean> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.ADD_FAVORITE), { postId }).pipe(
      map((res) => res?.data || false)
    );
  }
}
