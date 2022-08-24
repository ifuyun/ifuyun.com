import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiUrl } from '../config/api-url';
import { ApiService } from '../core/api.service';
import { UserAgentService } from '../core/user-agent.service';
import { AccessLog } from '../interfaces/common';
import { HttpResponseEntity } from '../interfaces/http-response';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  constructor(
    private apiService: ApiService,
    private userAgentService: UserAgentService
  ) {
  }

  parseAccessLog(initialized: boolean, referer: string): AccessLog {
    return {
      ...this.userAgentService.getUserAgentInfo(),
      requestUrl: location.href,
      referer: initialized ? referer : document.referrer,
      site: 'web',
      resolution: window.screen.width + 'x' + window.screen.height,
      colorDepth: window.screen.colorDepth.toString(),
      isAjax: initialized
    };
  }

  logAccess(log: AccessLog): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(this.apiService.getApiUrl(ApiUrl.SAVE_ACCESS_LOG), log);
  }
}
