import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiUrl } from '../../../config/api-url';
import { APP_ID } from '../../../config/common.constant';
import { ApiService } from '../../../core/api.service';
import {
  JdUnionParamGoodsJingfen,
  JdUnionParamGoodsMaterial,
  JdUnionResponseGoodsJingfen,
  JdUnionResponseGoodsMaterial,
  JdUnionPromotionResponse
} from '../jd-union.interface';

@Injectable({
  providedIn: 'root'
})
export class ShoppingService {
  constructor(private apiService: ApiService) {}

  getSellingPromotion(keyword: string): Observable<JdUnionPromotionResponse> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.JD_SELLING_PROMOTION), {
        keyword,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || {}));
  }

  getPromotionCommon(keyword: string): Observable<JdUnionPromotionResponse> {
    return this.apiService
      .httpGet(this.apiService.getApiUrl(ApiUrl.JD_PROMOTION_COMMON), {
        keyword,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || {}));
  }

  getGoodsMaterial(param: JdUnionParamGoodsMaterial, disableMessage = false): Observable<JdUnionResponseGoodsMaterial> {
    return this.apiService
      .httpGet(
        this.apiService.getApiUrl(ApiUrl.JD_GOODS_MATERIAL),
        {
          ...param,
          appId: APP_ID
        },
        disableMessage
      )
      .pipe(map((res) => res?.data || {}));
  }

  getGoodsJingfen(param: JdUnionParamGoodsJingfen, disableMessage = false): Observable<JdUnionResponseGoodsJingfen> {
    return this.apiService
      .httpGet(
        this.apiService.getApiUrl(ApiUrl.JD_GOODS_JINGFEN),
        {
          ...param,
          appId: APP_ID
        },
        disableMessage
      )
      .pipe(map((res) => res?.data || {}));
  }
}
