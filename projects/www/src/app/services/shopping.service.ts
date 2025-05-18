import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, AppConfigService } from 'common/core';
import {
  JdUnionParamGoodsJingfen,
  JdUnionParamGoodsMaterial,
  JdUnionPromotionResponse,
  JdUnionResponseGoodsJingfen,
  JdUnionResponseGoodsMaterial
} from 'common/interfaces';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShoppingService {
  constructor(
    private readonly apiService: ApiService,
    private readonly appConfigService: AppConfigService
  ) {}

  getSellingPromotion(keyword: string): Observable<JdUnionPromotionResponse> {
    return this.apiService
      .httpGet(ApiUrl.JD_SELLING_PROMOTION, {
        keyword,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || {}));
  }

  getPromotionCommon(keyword: string): Observable<JdUnionPromotionResponse> {
    return this.apiService
      .httpGet(ApiUrl.JD_PROMOTION_COMMON, {
        keyword,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || {}));
  }

  getGoodsMaterial(param: JdUnionParamGoodsMaterial, showMessage = false): Observable<JdUnionResponseGoodsMaterial> {
    return this.apiService
      .httpGet(
        ApiUrl.JD_GOODS_MATERIAL,
        {
          ...param,
          appId: this.appConfigService.appId
        },
        showMessage
      )
      .pipe(map((res) => res?.data || {}));
  }

  getGoodsJingfen(param: JdUnionParamGoodsJingfen, showMessage = false): Observable<JdUnionResponseGoodsJingfen> {
    return this.apiService
      .httpGet(
        ApiUrl.JD_GOODS_JINGFEN,
        {
          ...param,
          appId: this.appConfigService.appId
        },
        showMessage
      )
      .pipe(map((res) => res?.data || {}));
  }
}
