import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from '../../../config/api-url';
import { ApiService } from '../../../core/api.service';
import { JdUnionPromotion } from '../tool.interface';

@Injectable({
  providedIn: 'root'
})
export class ShoppingService {
  constructor(private apiService: ApiService) {}

  getSellingPromotion(keyword: string): Observable<JdUnionPromotion> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_JD_SELLING_PROMOTION), { keyword })
      .pipe(map((res) => res?.data || {}));
  }

  getPromotionCommon(keyword: string): Observable<JdUnionPromotion> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_JD_PROMOTION_COMMON), { keyword })
      .pipe(map((res) => res?.data || {}));
  }
}
