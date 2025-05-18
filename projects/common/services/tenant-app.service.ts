import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, AppConfigService } from 'common/core';
import { TenantAppModel } from 'common/interfaces';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TenantAppService {
  private appInfo: BehaviorSubject<TenantAppModel> = new BehaviorSubject<TenantAppModel>(<TenantAppModel>{});
  public appInfo$: Observable<TenantAppModel> = this.appInfo.asObservable();

  constructor(
    private readonly apiService: ApiService,
    private readonly appConfigService: AppConfigService
  ) {}

  getAppInfo(): Observable<TenantAppModel> {
    return this.apiService.httpGet(ApiUrl.TENANT_APP, { appId: this.appConfigService.appId }).pipe(
      map((res) => <TenantAppModel>(res?.data || {})),
      map((app): TenantAppModel => {
        return {
          ...app,
          keywords: (app.appKeywords || '').split(','),
          adminEmail: (app.appAdminEmail || '').split(',')
        };
      }),
      tap((app) => this.appInfo.next(app))
    );
  }
}
