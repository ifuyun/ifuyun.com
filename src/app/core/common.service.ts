import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ADMIN_URL } from '../config/common.constant';
import { OptionEntity } from '../interfaces/option.interface';
import { MetaData, PageOptions } from './common.interface';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private pageIndex: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public pageIndex$: Observable<string> = this.pageIndex.asObservable();

  private pageOptions: BehaviorSubject<PageOptions> = new BehaviorSubject<PageOptions>({
    showHeader: true,
    showFooter: true,
    showMobileHeader: true,
    showMobileFooter: true
  });
  public pageOptions$: Observable<PageOptions> = this.pageOptions.asObservable();

  updateActivePage(activePage: string) {
    this.pageIndex.next(activePage);
  }

  updatePageOptions(options: PageOptions) {
    this.pageOptions.next(options);
  }

  transformMeta(meta: MetaData[]): Record<string, string> {
    const result: Record<string, string> = {};
    meta.forEach((item) => (result[item.metaKey] = item.metaValue));
    return result;
  }

  getURL(options: OptionEntity, url: string) {
    return `${options['site_url']}${url}`;
  }
}
