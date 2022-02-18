import { Component, Input, OnInit } from '@angular/core';
import { OptionEntity } from '../../interfaces/options';
import { TaxonomyNode } from '../../interfaces/taxonomies';
import { TaxonomiesService } from '../../services/taxonomies.service';
import { OptionsService } from '../../services/options.service';
import { LinksService } from '../../services/links.service';
import { LinkEntity } from '../../interfaces/links';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.less']
})
export class HeaderComponent implements OnInit {
  @Input() options: OptionEntity = {};
  @Input() activePage: string = '';
  taxonomies: TaxonomyNode[] = [];
  quickLinks: LinkEntity[] = [];

  constructor(
    private taxonomiesService: TaxonomiesService,
    private linksService: LinksService
  ) {
  }

  ngOnInit(): void {
    this.taxonomiesService.getTaxonomies().subscribe((res) => this.taxonomies = res);
    this.linksService.getQuickLinks().subscribe((res) => this.quickLinks = res);
  }
}
