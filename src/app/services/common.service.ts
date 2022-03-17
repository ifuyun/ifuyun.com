import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BaseService } from '../core/base.service';

@Injectable({
  providedIn: 'root'
})
export class CommonService extends BaseService {
  private pageIndex: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public pageIndex$: Observable<string> = this.pageIndex.asObservable();

  updateActivePage(activePage: string) {
    this.pageIndex.next(activePage);
  }
}
