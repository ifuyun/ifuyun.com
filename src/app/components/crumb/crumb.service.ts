import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CrumbEntity } from './crumb.interface';

@Injectable({
  providedIn: 'root'
})
export class CrumbService {
  private crumbSource: BehaviorSubject<CrumbEntity[]> = new BehaviorSubject<CrumbEntity[]>([]);
  public crumb$: Observable<CrumbEntity[]> = this.crumbSource.asObservable();

  updateCrumb(crumbs: CrumbEntity[]) {
    this.crumbSource.next(crumbs);
  }
}
