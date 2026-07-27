import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, OptionEntity } from 'common/core';
import { Carousel } from 'common/interfaces';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OptionService {
  private options: BehaviorSubject<OptionEntity> = new BehaviorSubject<OptionEntity>({});
  public options$: Observable<OptionEntity> = this.options.asObservable();

  constructor(private readonly apiService: ApiService) {}

  getOptions(): Observable<OptionEntity> {
    return this.apiService.httpGet(ApiUrl.OPTION_FRONTEND, {}).pipe(
      map((res) => res?.data || {}),
      tap((options) => {
        this.options.next(options);
      })
    );
  }

  getCarousels(): Observable<Carousel[]> {
    return this.apiService.httpGet(ApiUrl.OPTION_CAROUSELS, {}).pipe(map((res) => res?.data || []));
  }
}
