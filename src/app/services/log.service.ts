import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { ApiUrl } from '../config/api-url';
import { APP_ID, COOKIE_KEY_UV_ID } from '../config/common.constant';
import { ApiService } from '../core/api.service';
import { HttpResponseEntity } from '../core/http-response.interface';
import { UserAgentService } from '../core/user-agent.service';
import { AccessLog, ActionLog, LeaveLog } from '../interfaces/log.interface';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  constructor(
    private apiService: ApiService,
    private userAgentService: UserAgentService,
    private cookieService: CookieService
  ) {}

  parseAccessLog(initialized: boolean, referrer: string, isNew: boolean, logId: string): AccessLog {
    return {
      ...this.userAgentService.getUserAgentInfo(),
      logId,
      faId: this.cookieService.get(COOKIE_KEY_UV_ID),
      isNew: isNew ? 1 : 0,
      accessUrl: window.location.href,
      referrer: initialized ? referrer : document.referrer,
      site: 'web',
      resolution: window.screen.width + 'x' + window.screen.height,
      colorDepth: window.screen.colorDepth.toString(),
      isAjax: initialized ? 1 : 0,
      appId: APP_ID
    };
  }

  logAccess(log: AccessLog): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.ACCESS_LOG_LIST), log, true);
  }

  logLeave(log: Omit<LeaveLog, 'appId'>): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(
      this.apiService.getApiUrl(ApiUrl.LEAVE_LOG),
      {
        ...log,
        appId: APP_ID
      },
      true
    );
  }

  logAction(log: Omit<ActionLog, 'faId' | 'ref' | 'appId'>): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(
      this.apiService.getApiUrl(ApiUrl.ACTION_LOG_LIST),
      {
        ...log,
        ref: window.location.href,
        faId: this.cookieService.get(COOKIE_KEY_UV_ID),
        site: 'web',
        appId: APP_ID
      },
      true
    );
  }
}
