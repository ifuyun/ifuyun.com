import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiUrl } from '../config/api-url';
import { APP_ID } from '../config/common.constant';
import { TenantAppModel } from '../interfaces/tenant-app';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class TenantAppService {
  private appInfo: BehaviorSubject<TenantAppModel> = new BehaviorSubject<TenantAppModel>(<TenantAppModel>{});
  public appInfo$: Observable<TenantAppModel> = this.appInfo.asObservable();

  constructor(private readonly apiService: ApiService) {}

  getAppInfo(): Observable<TenantAppModel> {
    return this.apiService.httpGet(ApiUrl.TENANT_APP, { appId: APP_ID }).pipe(
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
