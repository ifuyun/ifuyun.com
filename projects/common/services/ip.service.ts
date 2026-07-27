import { Injectable } from '@angular/core';
import { ApiService, ApiUrl } from 'common/core';
import { IPInfo, IPResult } from 'common/interfaces';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IpService {
  constructor(private readonly apiService: ApiService) {}

  searchIP(ip: string): Observable<IPResult> {
    return this.apiService
      .httpGet(ApiUrl.IP_SEARCH, {
        ip,
        s: 0
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
