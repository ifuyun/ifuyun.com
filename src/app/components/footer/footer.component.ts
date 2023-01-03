import { Component, OnDestroy, OnInit } from '@angular/core';
import { isEmpty } from 'lodash';
import { skipWhile, Subscription } from 'rxjs';
import { CommonService } from '../../core/common.service';
import { UserAgentService } from '../../core/user-agent.service';
import { OptionEntity } from '../../interfaces/option.interface';
import { OptionService } from '../../services/option.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.less']
})
export class FooterComponent implements OnInit, OnDestroy {
  isMobile = false;
  options: OptionEntity = {};
  curYear = new Date().getFullYear();
  showFooter = true;
  showMobileFooter = true;

  private optionsListener!: Subscription;

  constructor(
    private userAgentService: UserAgentService,
    private commonService: CommonService,
    private optionService: OptionService
  ) {
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.optionsListener = this.optionService.options$
      .pipe(skipWhile((options) => isEmpty(options)))
      .subscribe((options) => (this.options = options));
    this.commonService.pageOptions$.subscribe((options) => {
      this.showFooter = options.showFooter;
      this.showMobileFooter = options.showMobileFooter;
    });
  }

  ngOnDestroy(): void {
    this.optionsListener.unsubscribe();
  }
}
