import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, AppConfigService } from 'common/core';
import { CategoryType } from 'common/enums';
import { CategoryNode } from 'common/interfaces';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  constructor(
    private readonly apiService: ApiService,
    private readonly appConfigService: AppConfigService
  ) {}

  getCategories(type = CategoryType.POST): Observable<CategoryNode[]> {
    return this.apiService
      .httpGet(ApiUrl.CATEGORY_TREE, {
        type,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || []));
  }
}
