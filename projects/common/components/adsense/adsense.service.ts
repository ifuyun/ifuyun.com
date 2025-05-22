import { Injectable } from '@angular/core';
import { AdsStatus } from 'common/services';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdsenseService {
  private adsenseStatus: BehaviorSubject<AdsStatus> = new BehaviorSubject<AdsStatus>(AdsStatus.UNKNOWN);
  public adsenseStatus$: Observable<AdsStatus> = this.adsenseStatus.asObservable();

  updateAdsenseStatus(status: AdsStatus) {
    this.adsenseStatus.next(status);
  }
}
