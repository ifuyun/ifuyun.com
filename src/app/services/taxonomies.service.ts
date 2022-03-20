import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { ApiUrl } from '../config/api-url';
import { TaxonomyNode } from '../interfaces/taxonomies';

@Injectable({
  providedIn: 'root'
})
export class TaxonomiesService {
  constructor(
    private apiService: ApiService
  ) {
  }

  getTaxonomies():Observable<TaxonomyNode[]> {
    return this.apiService.httpGet(this.apiService.getApiUrl(ApiUrl.GET_TAXONOMIES)).pipe(
      map((res) => res?.data || [])
    );
  }
}
