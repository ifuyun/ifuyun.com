import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { LinkEntity } from '../../interfaces/links';
import { OptionEntity } from '../../interfaces/options';
import { TaxonomyNode } from '../../interfaces/taxonomies';
import { CommonService } from '../../core/common.service';
import { LinksService } from '../../services/links.service';
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
  quickLinks: LinkEntity[] = [];
  isLogin: boolean = false;

  private optionsListener!: Subscription;
  private taxonomiesListener!: Subscription;
  private linksListener!: Subscription;
  private commonListener!: Subscription;

  constructor(
    private optionsService: OptionsService,
    private taxonomiesService: TaxonomiesService,
    private linksService: LinksService,
    private commonService: CommonService
  ) {
  }

  ngOnInit(): void {
    this.optionsListener = this.optionsService.options$.subscribe((options) => this.options = options);
    this.taxonomiesListener = this.taxonomiesService.getTaxonomies().subscribe((taxonomies) => this.taxonomies = taxonomies);
    this.linksListener = this.linksService.getQuickLinks().subscribe((links) => this.quickLinks = links);
    this.commonListener = this.commonService.pageIndex$.subscribe((pageIndex) => this.activePage = pageIndex);
  }

  ngOnDestroy(): void {
    this.optionsListener.unsubscribe();
    this.taxonomiesListener.unsubscribe();
    this.linksListener.unsubscribe();
    this.commonListener.unsubscribe();
  }
}
