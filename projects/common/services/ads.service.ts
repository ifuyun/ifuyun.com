import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AdsStatus } from './log.service';

@Injectable({
  providedIn: 'root'
})
export class AdsService {
  private adsStatus: BehaviorSubject<AdsStatus> = new BehaviorSubject<AdsStatus>(AdsStatus.UNKNOWN);
  public adsStatus$: Observable<AdsStatus> = this.adsStatus.asObservable();

  updateAdsStatus(status: AdsStatus) {
    this.adsStatus.next(status);
  }
}
