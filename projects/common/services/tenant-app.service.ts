import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, AppConfigService } from 'common/core';
import { TenantAppVo } from 'common/interfaces';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TenantAppService {
  private appInfo: BehaviorSubject<TenantAppVo> = new BehaviorSubject<TenantAppVo>(<TenantAppVo>{});
  public appInfo$: Observable<TenantAppVo> = this.appInfo.asObservable();

  constructor(
    private readonly apiService: ApiService,
    private readonly appConfigService: AppConfigService
  ) {}

  getAppInfo(): Observable<TenantAppVo> {
    return this.apiService.httpGet(ApiUrl.TENANT_APP, { appId: this.appConfigService.appId }).pipe(
      map((res) => <TenantAppVo>(res?.data || {})),
      map((app): TenantAppVo => {
        return {
          ...app,
          keywordList: (app.keywords || '').split(',')
        };
      }),
      tap((app) => this.appInfo.next(app))
    );
  }
}
