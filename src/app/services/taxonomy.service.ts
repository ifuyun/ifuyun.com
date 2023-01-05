import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
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
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_TAXONOMY_TREE))
      .pipe(map((res) => res?.data || []));
  }
}
