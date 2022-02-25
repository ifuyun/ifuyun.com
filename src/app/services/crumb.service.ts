import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BaseService } from '../core/base.service';
import { CrumbEntity } from '../interfaces/crumb';

@Injectable({
  providedIn: 'root'
})
export class CrumbService extends BaseService {
  private crumbSource: BehaviorSubject<CrumbEntity[]> = new BehaviorSubject<CrumbEntity[]>([]);
  public crumb$: Observable<CrumbEntity[]> = this.crumbSource.asObservable();

  updateCrumb(crumbs: CrumbEntity[]) {
    this.crumbSource.next(crumbs);
  }
}
