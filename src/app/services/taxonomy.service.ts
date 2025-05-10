import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiUrl } from 'src/app/config/api-url';
import { APP_ID } from 'src/app/config/common.constant';
import { TaxonomyType } from 'src/app/enums/taxonomy';
import { TaxonomyNode } from 'src/app/interfaces/taxonomy';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class TaxonomyService {
  constructor(private readonly apiService: ApiService) {}

  getTaxonomies(type = TaxonomyType.POST): Observable<TaxonomyNode[]> {
    return this.apiService
      .httpGet(ApiUrl.TAXONOMY_TREE, {
        type,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || []));
  }
}
