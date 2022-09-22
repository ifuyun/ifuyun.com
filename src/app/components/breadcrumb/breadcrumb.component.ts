import { Component, OnDestroy, OnInit } from '@angular/core';
import { isEmpty } from 'lodash';
import { skipWhile, Subscription } from 'rxjs';
import { UserAgentService } from '../../core/user-agent.service';
import { BreadcrumbEntity } from './breadcrumb.interface';
import { OptionEntity } from '../../interfaces/option.interface';
import { BreadcrumbService } from './breadcrumb.service';
import { OptionService } from '../../services/option.service';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.less']
})
export class BreadcrumbComponent implements OnInit, OnDestroy {
  isMobile = false;
  breadcrumbs: BreadcrumbEntity[] = [];
  options: OptionEntity = {};

  private breadcrumbListener!: Subscription;
  private optionsListener!: Subscription;

  constructor(
    private breadcrumbService: BreadcrumbService,
    private optionService: OptionService,
    private userAgentService: UserAgentService
  ) {
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.optionsListener = this.optionService.options$
      .pipe(skipWhile((options) => isEmpty(options)))
      .subscribe((options) => (this.options = options));
    this.breadcrumbListener = this.breadcrumbService.crumb$.subscribe((breadcrumbs) => {
      this.breadcrumbs = [...breadcrumbs];
      this.breadcrumbs.unshift({
        label: '首页',
        url: '/',
        tooltip: (this.options && this.options['site_name']) || '',
        isHeader: false
      });
    });
  }

  ngOnDestroy() {
    this.breadcrumbListener.unsubscribe();
    this.optionsListener.unsubscribe();
  }
}
