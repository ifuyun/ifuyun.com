import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, AppConfigService } from 'common/core';
import { TaxonomyType } from 'common/enums';
import { TaxonomyNode } from 'common/interfaces';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaxonomyService {
  constructor(
    private readonly apiService: ApiService,
    private readonly appConfigService: AppConfigService
  ) {}

  getTaxonomies(type = TaxonomyType.POST): Observable<TaxonomyNode[]> {
    return this.apiService
      .httpGet(ApiUrl.TAXONOMY_TREE, {
        type,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || []));
  }
}
