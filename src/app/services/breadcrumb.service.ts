import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BreadcrumbEntity } from '../interfaces/breadcrumb';

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private breadcrumbs: BehaviorSubject<BreadcrumbEntity[]> = new BehaviorSubject<BreadcrumbEntity[]>([]);
  public breadcrumbs$: Observable<BreadcrumbEntity[]> = this.breadcrumbs.asObservable();

  updateBreadcrumbs(breadcrumbs: BreadcrumbEntity[]) {
    this.breadcrumbs.next(breadcrumbs);
  }
}
