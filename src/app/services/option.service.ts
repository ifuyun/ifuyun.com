import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { ApiUrl } from '../config/api-url';
import { APP_ID } from '../config/common.constant';
import { CarouselVo, OptionEntity, OptionModel } from '../interfaces/option';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class OptionService {
  private options: BehaviorSubject<OptionEntity> = new BehaviorSubject<OptionEntity>({});
  public options$: Observable<OptionEntity> = this.options.asObservable();

  constructor(private readonly apiService: ApiService) {}

  getOptions(): Observable<OptionEntity> {
    return this.apiService
      .httpGet(ApiUrl.OPTION_FRONTEND, {
        appId: APP_ID
      })
      .pipe(
        map((res) => res?.data || {}),
        tap((options) => {
          this.options.next(options);
        })
      );
  }

  getOptionByKey(key: string): Observable<OptionModel> {
    return this.apiService
      .httpGet(ApiUrl.OPTION, {
        key,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || {}));
  }

  getCarousels(): Observable<CarouselVo[]> {
    return this.apiService
      .httpGet(ApiUrl.OPTION_CAROUSELS, {
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || []));
  }
}
