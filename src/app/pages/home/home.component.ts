import { Component, OnInit } from '@angular/core';
import { OptionEntity } from '../../interfaces/options';
import { OptionsService } from '../../services/options.service';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent implements OnInit {
  pageIndex: string = '';
  options: OptionEntity = {};

  constructor(
    private optionsService: OptionsService,
    private commonService: CommonService
  ) {
  }

  ngOnInit(): void {
    this.optionsService.options$.subscribe((res) => this.options = res);
    this.commonService.pageIndex$.subscribe((activePage) => {
      this.pageIndex = activePage;
    });
  }
}
