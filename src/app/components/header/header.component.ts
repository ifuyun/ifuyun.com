import { Component, Input, OnInit } from '@angular/core';
import { LinkEntity } from '../../interfaces/links';
import { OptionEntity } from '../../interfaces/options';
import { TaxonomyNode } from '../../interfaces/taxonomies';
import { LinksService } from '../../services/links.service';
import { TaxonomiesService } from '../../services/taxonomies.service';

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
  isLogin: boolean = false;

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
