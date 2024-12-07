import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from '../config/api-url';
import { APP_ID } from '../config/common.constant';
import { ResultList } from '../interfaces/common';
import { SearchParam, SearchResponse } from '../interfaces/search';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  constructor(private apiService: ApiService) {}

  search(param: SearchParam): Observable<ResultList<SearchResponse>> {
    return this.apiService
      .httpGet(ApiUrl.SEARCH, {
        ...param,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || {}));
  }
}
