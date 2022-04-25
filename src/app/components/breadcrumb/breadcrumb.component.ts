import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { UserAgentService } from '../../core/user-agent.service';
import { BreadcrumbEntity } from './breadcrumb.interface';
import { OptionEntity } from '../../interfaces/options';
import { BreadcrumbService } from './breadcrumb.service';
import { OptionsService } from '../../services/options.service';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.less']
})
export class BreadcrumbComponent implements OnInit, OnDestroy {
  isMobile = false;
  crumbs: BreadcrumbEntity[] = [];
  options: OptionEntity | null = null;

  private crumbListener!: Subscription;
  private optionsListener!: Subscription;

  constructor(
    private crumbService: BreadcrumbService,
    private optionsService: OptionsService,
    private userAgentService: UserAgentService,
  ) {
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.optionsListener = this.optionsService.options$.subscribe((options) => {
      this.options = options;
    });
    this.crumbListener = this.crumbService.crumb$.subscribe((crumbs) => {
      this.crumbs = [...crumbs];
      this.crumbs.unshift({
        'label': '首页',
        'url': '/',
        'tooltip': this.options && this.options['site_name'] || '',
        'isHeader': false
      });
    });
  }

  ngOnDestroy() {
    this.crumbListener.unsubscribe();
    this.optionsListener.unsubscribe();
  }
}
