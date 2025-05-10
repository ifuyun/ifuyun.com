import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiUrl } from 'src/app/config/api-url';
import { APP_ID } from 'src/app/config/common.constant';
import { IPInfo, IPResult } from 'src/app/interfaces/ip';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class IpService {
  constructor(private readonly apiService: ApiService) {}

  searchIP(ip: string): Observable<IPResult> {
    return this.apiService
      .httpGet(ApiUrl.IP_SEARCH, {
        ip,
        s: 0,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || {}));
  }

  getIPLocation(ipInfo?: IPInfo) {
    if (!ipInfo) {
      return '未知地区';
    }
    if (ipInfo.city) {
      return ipInfo.province + ' · ' + ipInfo.city;
    }
    if (ipInfo.province) {
      return ipInfo.country + ' · ' + ipInfo.province;
    }
    return ipInfo.country;
  }
}
