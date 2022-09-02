import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MetaData } from '../interfaces/common';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private pageIndex: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public pageIndex$: Observable<string> = this.pageIndex.asObservable();

  updateActivePage(activePage: string) {
    this.pageIndex.next(activePage);
  }

  transformMeta(meta: MetaData[]): Record<string, string> {
    const result: Record<string, string> = {};
    meta.forEach((item) => (result[item.metaKey] = item.metaValue));
    return result;
  }
}
