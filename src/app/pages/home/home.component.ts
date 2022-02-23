import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../../core/base.component';
import { OptionEntity } from '../../interfaces/options';
import { OptionsService } from '../../services/options.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent extends BaseComponent implements OnInit {
  pageIndex: string = '';
  options: OptionEntity = {};

  constructor(
    private optionsService: OptionsService
  ) {
    super();
  }

  ngOnInit(): void {
    this.optionsService.getOptions().subscribe((res) => this.options = res);
  }

  onOutletLoaded(component: BaseComponent) {
    this.pageIndex = component.pageIndex;
  }
}
