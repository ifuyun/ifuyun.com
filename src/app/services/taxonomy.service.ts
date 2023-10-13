import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { APP_ID } from '../config/common.constant';
import { ApiService } from '../core/api.service';
import { ApiUrl } from '../config/api-url';
import { TaxonomyNode } from '../interfaces/taxonomy.interface';

@Injectable({
  providedIn: 'root'
})
export class TaxonomyService {
  constructor(private apiService: ApiService) {}

  getTaxonomies(): Observable<TaxonomyNode[]> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.TAXONOMY_TREE), {
        type: 'post',
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || []));
  }
}
