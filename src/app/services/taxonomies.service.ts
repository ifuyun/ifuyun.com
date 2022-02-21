import { Injectable } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { BaseApiService } from '../core/base-api.service';
import { HttpClient } from '@angular/common/http';
import { TaxonomyNode } from '../interfaces/taxonomies';
import { Observable } from 'rxjs';
import { ApiUrl } from '../enums/api-url';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TaxonomiesService extends BaseApiService {
  constructor(
    protected http: HttpClient,
    protected message: NzMessageService
  ) {
    super();
  }

  getTaxonomies():Observable<TaxonomyNode[]> {
    return this.httpGet(this.getApiUrl(ApiUrl.GET_TAXONOMIES)).pipe(
      map((res) => res.data || [])
    );
  }
}
