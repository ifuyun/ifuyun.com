import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonService } from '../../core/common.service';
import { OptionEntity } from '../../interfaces/options';
import { TaxonomyNode } from '../../interfaces/taxonomies';
import { OptionsService } from '../../services/options.service';
import { TaxonomiesService } from '../../services/taxonomies.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.less']
})
export class HeaderComponent implements OnInit, OnDestroy {
  options: OptionEntity = {};
  activePage: string = '';
  taxonomies: TaxonomyNode[] = [];
  isLogin: boolean = false;

  private optionsListener!: Subscription;
  private taxonomiesListener!: Subscription;
  private commonListener!: Subscription;

  constructor(
    private optionsService: OptionsService,
    private taxonomiesService: TaxonomiesService,
    private commonService: CommonService
  ) {
  }

  ngOnInit(): void {
    this.optionsListener = this.optionsService.options$.subscribe((options) => this.options = options);
    this.taxonomiesListener = this.taxonomiesService.getTaxonomies()
      .subscribe((taxonomies) => this.taxonomies = taxonomies);
    this.commonListener = this.commonService.pageIndex$.subscribe((pageIndex) => this.activePage = pageIndex);
  }

  ngOnDestroy(): void {
    this.optionsListener.unsubscribe();
    this.taxonomiesListener.unsubscribe();
    this.commonListener.unsubscribe();
  }
}
