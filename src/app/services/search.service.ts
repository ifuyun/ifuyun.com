import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiUrl } from '../config/api-url';
import { ApiService } from '../core/api.service';
import { ResultList, SearchParam, SearchResponse } from '../core/common.interface';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  constructor(private apiService: ApiService) {}

  search(param: SearchParam): Observable<ResultList<SearchResponse>> {
    return this.apiService.httpGet(this.apiService.getApiUrl(ApiUrl.SEARCH), param).pipe(map((res) => res?.data || {}));
  }
}
