import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, AppConfigService, OptionEntity, OptionModel } from 'common/core';
import { CarouselVo } from 'common/interfaces';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OptionService {
  private options: BehaviorSubject<OptionEntity> = new BehaviorSubject<OptionEntity>({});
  public options$: Observable<OptionEntity> = this.options.asObservable();

  constructor(
    private readonly apiService: ApiService,
    private readonly appConfigService: AppConfigService
  ) {}

  getOptions(): Observable<OptionEntity> {
    return this.apiService
      .httpGet(ApiUrl.OPTION_FRONTEND, {
        appId: this.appConfigService.appId
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
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || {}));
  }

  getCarousels(): Observable<CarouselVo[]> {
    return this.apiService
      .httpGet(ApiUrl.OPTION_CAROUSELS, {
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || []));
  }
}
