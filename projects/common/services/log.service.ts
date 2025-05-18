import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, AppConfigService, HttpResponseEntity, UserAgentService } from 'common/core';
import { AccessLog, ActionLog, LeaveLog } from 'common/interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  constructor(
    private readonly apiService: ApiService,
    private readonly userAgentService: UserAgentService,
    private readonly appConfigService: AppConfigService
  ) {}

  parseAccessLog(initialized: boolean, referrer: string, isNew: boolean, logId: string): AccessLog {
    return {
      ...this.userAgentService.uaInfo,
      isMobile: this.userAgentService.uaInfo.isMobile ? 1 : 0,
      isCrawler: this.userAgentService.uaInfo.isCrawler ? 1 : 0,
      logId,
      isNew: isNew ? 1 : 0,
      accessUrl: location.href,
      referrer: initialized ? referrer : document.referrer,
      site: 'web',
      resolution: window.screen.width + 'x' + window.screen.height,
      colorDepth: window.screen.colorDepth.toString(),
      isAjax: initialized ? 1 : 0,
      appId: this.appConfigService.appId
    };
  }

  logAccess(log: AccessLog): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(ApiUrl.ACCESS_LOG, log, false);
  }

  logLeave(log: Omit<LeaveLog, 'appId'>): void {
    if (log.logId) {
      navigator.sendBeacon(
        this.apiService.getApiUrl(ApiUrl.LEAVE_LOG),
        JSON.stringify({
          ...log,
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
        ref: location.href,
        site: 'web',
        appId: this.appConfigService.appId
      },
      false
    );
  }
}
