import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../../core/base.component';
import { OptionEntity } from '../../interfaces/options';
import { OptionsService } from '../../services/options.service';
import { PagesService } from '../../services/pages.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent extends BaseComponent implements OnInit {
  pageIndex: string = '';
  options: OptionEntity = {};

  constructor(
    private optionsService: OptionsService,
    private pagesService: PagesService
  ) {
    super();
  }

  ngOnInit(): void {
    this.optionsService.options$.subscribe((res) => this.options = res);
    this.pagesService.page$.subscribe((activePage) => this.pageIndex = activePage);
  }
}
