import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiUrl } from '../config/api-url';
import { APP_ID } from '../config/common.constant';
import { HttpResponseEntity } from '../interfaces/http-response';
import { AccessLog, ActionLog, LeaveLog } from '../interfaces/log';
import { ApiService } from './api.service';
import { UserAgentService } from './user-agent.service';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  constructor(
    private readonly apiService: ApiService,
    private readonly userAgentService: UserAgentService
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
      appId: APP_ID
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
          appId: APP_ID
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
        appId: APP_ID
      },
      false
    );
  }
}
