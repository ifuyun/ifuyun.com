import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AdsenseStatus } from './adsense.enum';

@Injectable({
  providedIn: 'root'
})
export class AdsenseService {
  private adsenseStatus: BehaviorSubject<AdsenseStatus> = new BehaviorSubject<AdsenseStatus>(AdsenseStatus.UNKNOWN);
  public adsenseStatus$: Observable<AdsenseStatus> = this.adsenseStatus.asObservable();

  updateAdsenseStatus(status: AdsenseStatus) {
    this.adsenseStatus.next(status);
  }
}
