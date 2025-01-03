import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiUrl } from '../config/api-url';
import { APP_ID } from '../config/common.constant';
import {
  JdUnionParamGoodsJingfen,
  JdUnionParamGoodsMaterial,
  JdUnionPromotionResponse,
  JdUnionResponseGoodsJingfen,
  JdUnionResponseGoodsMaterial
} from '../interfaces/jd-union';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class ShoppingService {
  constructor(private apiService: ApiService) {}

  getSellingPromotion(keyword: string): Observable<JdUnionPromotionResponse> {
    return this.apiService
      .httpGet(ApiUrl.JD_SELLING_PROMOTION, {
        keyword,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || {}));
  }

  getPromotionCommon(keyword: string): Observable<JdUnionPromotionResponse> {
    return this.apiService
      .httpGet(ApiUrl.JD_PROMOTION_COMMON, {
        keyword,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || {}));
  }

  getGoodsMaterial(param: JdUnionParamGoodsMaterial, disableMessage = true): Observable<JdUnionResponseGoodsMaterial> {
    return this.apiService
      .httpGet(
        ApiUrl.JD_GOODS_MATERIAL,
        {
          ...param,
          appId: APP_ID
        },
        disableMessage
      )
      .pipe(map((res) => res?.data || {}));
  }

  getGoodsJingfen(param: JdUnionParamGoodsJingfen, disableMessage = true): Observable<JdUnionResponseGoodsJingfen> {
    return this.apiService
      .httpGet(
        ApiUrl.JD_GOODS_JINGFEN,
        {
          ...param,
          appId: APP_ID
        },
        disableMessage
      )
      .pipe(map((res) => res?.data || {}));
  }
}
