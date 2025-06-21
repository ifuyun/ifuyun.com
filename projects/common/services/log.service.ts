import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, AppConfigService, HttpResponseEntity } from 'common/core';
import { AccessLog, ActionLog } from 'common/interfaces';
import { Observable } from 'rxjs';

export enum AdsStatus {
  UNKNOWN = 0,
  ENABLED = 1,
  DISABLED = 2,
  BLOCKED = 3,
  ERROR = 4
}

@Injectable({
  providedIn: 'root'
})
export class LogService {
  constructor(
    private readonly apiService: ApiService,
    private readonly appConfigService: AppConfigService
  ) {}

  parseAccessLog(param: {
    initialized: boolean;
    referrer: string;
    isNew: boolean;
    adsStatus?: AdsStatus;
    logId: string;
  }): AccessLog {
    const { initialized, referrer, isNew, adsStatus, logId } = param;

    return {
      li: logId,
      in: isNew ? 1 : 0,
      au: location.href,
      rf: initialized ? referrer : document.referrer,
      s: 'web',
      as: adsStatus || AdsStatus.UNKNOWN,
      rs: window.screen.width + 'x' + window.screen.height,
      cd: window.screen.colorDepth.toString(),
      ia: initialized ? 1 : 0,
      appId: this.appConfigService.appId
    };
  }

  logAccess(log: AccessLog): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(ApiUrl.LOG_ACCESS, log, false);
  }

  logAdsStatus(logId: string, status: AdsStatus): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(
      ApiUrl.LOG_ADS,
      {
        logId,
        status,
        appId: this.appConfigService.appId
      },
      false
    );
  }

  logLeave(logId: string): void {
    if (logId) {
      navigator.sendBeacon(
        this.apiService.getApiUrl(ApiUrl.LOG_LEAVE),
        JSON.stringify({
          logId,
          appId: this.appConfigService.appId
        })
      );
    }
  }

  logAction(log: Omit<ActionLog, 'faId' | 'ref' | 'appId'>): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(
      ApiUrl.LOG_ACTION,
      {
        ...log,
        ref: location.href,
        site: 'web',
        appId: this.appConfigService.appId
      },
      false
    );
  }
}
