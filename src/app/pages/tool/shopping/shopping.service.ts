import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from '../../../config/api-url';
import { ApiService } from '../../../core/api.service';
import {
  JdUnionParamGoodsJingfen,
  JdUnionParamGoodsMaterial,
  JdUnionResponseGoodsJingfen,
  JdUnionResponseGoodsMaterial,
  JdUnionResponsePromotion
} from '../jd-union.interface';

@Injectable({
  providedIn: 'root'
})
export class ShoppingService {
  constructor(private apiService: ApiService) {}

  getSellingPromotion(keyword: string): Observable<JdUnionResponsePromotion> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_JD_SELLING_PROMOTION), { keyword })
      .pipe(map((res) => res?.data || {}));
  }

  getPromotionCommon(keyword: string): Observable<JdUnionResponsePromotion> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_JD_PROMOTION_COMMON), { keyword })
      .pipe(map((res) => res?.data || {}));
  }

  getGoodsMaterial(param: JdUnionParamGoodsMaterial): Observable<JdUnionResponseGoodsMaterial> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_JD_GOODS_MATERIAL), param)
      .pipe(map((res) => res?.data || {}));
  }

  getGoodsJingfen(param: JdUnionParamGoodsJingfen): Observable<JdUnionResponseGoodsJingfen> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.GET_JD_GOODS_JINGFEN), param)
      .pipe(map((res) => res?.data || {}));
  }
}
