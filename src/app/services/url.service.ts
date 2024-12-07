import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UrlHistory } from '../interfaces/url';

@Injectable({
  providedIn: 'root'
})
export class UrlService {
  private urlInfo: BehaviorSubject<UrlHistory> = new BehaviorSubject<UrlHistory>({ previous: '', current: '' });
  public urlInfo$: Observable<UrlHistory> = this.urlInfo.asObservable();

  updateUrlHistory(urlInfo: UrlHistory) {
    this.urlInfo.next(urlInfo);
  }
}
