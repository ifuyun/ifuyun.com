import { Injectable } from '@angular/core';
import { IPInfo } from 'common/interfaces';

@Injectable({
  providedIn: 'root'
})
export class IpService {
  getIPLocation(ipInfo?: IPInfo) {
    if (!ipInfo) {
      return '未知地区';
    }
    const location: string[] = [];
    if (ipInfo.city) {
      location.push(ipInfo.city);

      if (ipInfo.province) {
        location.unshift(ipInfo.province);
      }
      return location.join(' · ');
    }
    if (ipInfo.province) {
      location.push(ipInfo.province);

      if (ipInfo.country) {
        location.unshift(ipInfo.country);
      }
      return location.join(' · ');
    }
    return ipInfo.country || '未知地区';
  }
}
