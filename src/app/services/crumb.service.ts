import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { BaseService } from '../core/base.service';
import { CrumbEntity } from '../interfaces/crumb.interface';

@Injectable({
  providedIn: 'root'
})
export class CrumbService extends BaseService {
  private crumbSource = new Subject<CrumbEntity[]>();
  crumb$ = this.crumbSource.asObservable();

  updateCrumb(crumb: CrumbEntity[]) {
    this.crumbSource.next(crumb);
  }
}
