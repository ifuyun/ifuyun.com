import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiUrl } from '../config/api-url';
import { APP_ID } from '../config/common.constant';
import { ApiService } from '../core/api.service';
import { HttpResponseEntity } from '../core/http-response.interface';
import { UserAgentService } from '../core/user-agent.service';
import { AccessLog, ActionLog } from '../interfaces/log.interface';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  constructor(
    private apiService: ApiService,
    private userAgentService: UserAgentService
  ) {}

  parseAccessLog(initialized: boolean, referer: string): AccessLog {
    return {
      ...this.userAgentService.getUserAgentInfo(),
      requestUrl: location.href,
      referer: initialized ? referer : document.referrer,
      site: 'web',
      resolution: window.screen.width + 'x' + window.screen.height,
      colorDepth: window.screen.colorDepth.toString(),
      isAjax: initialized,
      appId: APP_ID
    };
  }

  logAccess(log: AccessLog): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.ACCESS_LOG_LIST), log, true);
  }

  logAction(log: ActionLog): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.ACTION_LOG_LIST), log, true);
  }
}
