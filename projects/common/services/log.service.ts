import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, AppConfigService, HttpResponseEntity } from 'common/core';
import { AccessLog, ActionLog } from 'common/interfaces';
import { Observable } from 'rxjs';
import { CommonService } from './common.service';

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
    private readonly commonService: CommonService,
    private readonly appConfigService: AppConfigService
  ) {}

  buildAccessLog(param: {
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
      sw: this.commonService.getScreenWidth(),
      sh: this.commonService.getScreenHeight(),
      cd: window.screen.colorDepth.toString(),
      ia: initialized ? 1 : 0
    };
  }

  logAccess(log: AccessLog): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(ApiUrl.ACCESS_LOG, log, false);
  }

  logLeave(logId: string): void {
    if (logId) {
      navigator.sendBeacon(
        this.apiService.getApiUrl(ApiUrl.ACCESS_LOG_LEAVE),
        JSON.stringify({
          logId,
          appId: this.appConfigService.appId
        })
      );
    }
  }

  logAction(log: Omit<ActionLog, 'faId' | 'ref' | 'appId'>): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(
      ApiUrl.ACTION_LOG,
      {
        ...log,
        ref: location.href
      },
      false
    );
  }

  logAdsStatus(logId: string, status: AdsStatus): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(
      ApiUrl.ACCESS_LOG_PLUGIN,
      {
        logId,
        status
      },
      false
    );
  }
}
