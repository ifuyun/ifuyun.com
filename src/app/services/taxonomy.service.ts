import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { APP_ID } from '../config/common.constant';
import { ApiUrl } from '../config/api-url';
import { TaxonomyNode } from '../interfaces/taxonomy';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class TaxonomyService {
  constructor(private apiService: ApiService) {}

  getTaxonomies(): Observable<TaxonomyNode[]> {
    return this.apiService
      .httpGet(ApiUrl.TAXONOMY_TREE, {
        type: 'post',
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || []));
  }
}
