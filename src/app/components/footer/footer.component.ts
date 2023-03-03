import { NgClass, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
import { CommonService } from '../../core/common.service';
import { DestroyService } from '../../core/destroy.service';
import { UserAgentService } from '../../core/user-agent.service';
import { OptionEntity } from '../../interfaces/option.interface';
import { OptionService } from '../../services/option.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.less'],
  providers: [DestroyService],
  standalone: true,
  imports: [NgClass, NgIf, RouterLink]
})
export class FooterComponent implements OnInit {
  isMobile = false;
  options: OptionEntity = {};
  curYear = new Date().getFullYear();
  showFooter = true;
  showMobileFooter = true;

  constructor(
    private destroy$: DestroyService,
    private userAgentService: UserAgentService,
    private commonService: CommonService,
    private optionService: OptionService
  ) {
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => (this.options = options));
    this.commonService.pageOptions$.pipe(takeUntil(this.destroy$)).subscribe((options) => {
      this.showFooter = options.showFooter;
      this.showMobileFooter = options.showMobileFooter;
    });
  }
}
