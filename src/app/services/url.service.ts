import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UrlInfo } from '../interfaces/url';

@Injectable({
  providedIn: 'root'
})
export class UrlService {
  private urlInfo: BehaviorSubject<UrlInfo> = new BehaviorSubject<UrlInfo>({ previous: '', current: '' });
  public urlInfo$: Observable<UrlInfo> = this.urlInfo.asObservable();

  updatePreviousUrl(urlInfo: UrlInfo) {
    this.urlInfo.next(urlInfo);
  }
}
