import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CrumbEntity } from '../../interfaces/crumb';
import { OptionEntity } from '../../interfaces/options';
import { CrumbService } from '../../services/crumb.service';
import { OptionsService } from '../../services/options.service';

@Component({
  selector: 'app-crumb',
  templateUrl: './crumb.component.html',
  styleUrls: ['./crumb.component.less']
})
export class CrumbComponent implements OnInit, OnDestroy {
  crumbs: CrumbEntity[] = [];
  options: OptionEntity | null = null;
  separator: string = '&nbsp;→&nbsp;';

  private crumbListener!: Subscription;
  private optionsListener!: Subscription;

  constructor(
    private crumbService: CrumbService,
    private optionsService: OptionsService
  ) {
  }

  ngOnInit(): void {
    this.optionsListener = this.optionsService.options$.subscribe((options) => {
      this.options = options;
    });
    this.crumbListener = this.crumbService.crumb$.subscribe((crumbs) => {
      this.crumbs = crumbs;
      this.crumbs.unshift({
        'label': '首页',
        'url': '/',
        'tooltip': this.options && this.options['site_name'] || '',
        'headerFlag': false
      });
    });
  }

  ngOnDestroy() {
    this.crumbListener.unsubscribe();
    this.optionsListener.unsubscribe();
  }
}
