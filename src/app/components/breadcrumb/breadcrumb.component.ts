import { Component, OnInit } from '@angular/core';
import { isEmpty } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
import { DestroyService } from '../../core/destroy.service';
import { UserAgentService } from '../../core/user-agent.service';
import { OptionEntity } from '../../interfaces/option.interface';
import { OptionService } from '../../services/option.service';
import { BreadcrumbEntity } from './breadcrumb.interface';
import { BreadcrumbService } from './breadcrumb.service';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.less'],
  providers: [DestroyService]
})
export class BreadcrumbComponent implements OnInit {
  isMobile = false;
  breadcrumbs: BreadcrumbEntity[] = [];
  options: OptionEntity = {};

  constructor(
    private destroy$: DestroyService,
    private breadcrumbService: BreadcrumbService,
    private optionService: OptionService,
    private userAgentService: UserAgentService
  ) {
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => (this.options = options));
    this.breadcrumbService.crumb$.pipe(takeUntil(this.destroy$)).subscribe((breadcrumbs) => {
      this.breadcrumbs = [...breadcrumbs];
      this.breadcrumbs.unshift({
        label: '首页',
        url: '/',
        tooltip: (this.options && this.options['site_name']) || '',
        isHeader: false
      });
    });
  }
}
