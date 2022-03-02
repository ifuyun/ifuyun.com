import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BaseService } from '../core/base.service';
import { UrlInfo } from '../interfaces/url';

@Injectable({
  providedIn: 'root'
})
export class UrlService extends BaseService {
  private urlInfo: BehaviorSubject<UrlInfo> = new BehaviorSubject<UrlInfo>({ previous: '', current: '' });
  public urlInfo$: Observable<UrlInfo> = this.urlInfo.asObservable();

  updatePreviousUrl(urlInfo: UrlInfo) {
    this.urlInfo.next(urlInfo);
  }
}
