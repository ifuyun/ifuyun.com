import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BreadcrumbEntity } from './breadcrumb.interface';

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private crumbSource: BehaviorSubject<BreadcrumbEntity[]> = new BehaviorSubject<BreadcrumbEntity[]>([]);
  public crumb$: Observable<BreadcrumbEntity[]> = this.crumbSource.asObservable();

  updateBreadcrumb(breadcrumbs: BreadcrumbEntity[]) {
    this.crumbSource.next(breadcrumbs);
  }
}
