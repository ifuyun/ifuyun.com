import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { ApiUrl } from '../config/api-url';
import { CarouselVo, OptionEntity } from '../interfaces/option.interface';

@Injectable({
  providedIn: 'root'
})
export class OptionService {
  private options: BehaviorSubject<OptionEntity> = new BehaviorSubject<OptionEntity>({});
  public options$: Observable<OptionEntity> = this.options.asObservable();

  constructor(private apiService: ApiService) {}

  getOptions(): Observable<OptionEntity> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_OPTIONS), {
        autoload: 1
      })
      .pipe(
        map((res) => res?.data || {}),
        tap((options) => {
          this.options.next(options);
        })
      );
  }

  getCarousels(): Observable<CarouselVo[]> {
    return this.apiService.httpGet(this.apiService.getApiUrl(ApiUrl.GET_CAROUSELS)).pipe(map((res) => res?.data || []));
  }
}
