import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
import { CommonService } from '../../core/common.service';
import { DestroyService } from '../../core/destroy.service';
import { UserAgentService } from '../../core/user-agent.service';
import { LinkEntity } from '../../interfaces/link.interface';
import { OptionEntity } from '../../interfaces/option.interface';
import { LinkService } from '../../services/link.service';
import { OptionService } from '../../services/option.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.less'],
  standalone: true,
  imports: [CommonModule, RouterLink],
  providers: [DestroyService]
})
export class FooterComponent implements OnInit {
  isMobile = false;
  options: OptionEntity = {};
  curYear = new Date().getFullYear();
  showFooter = true;
  showMobileFooter = true;
  footerLinks: LinkEntity[] = [];

  constructor(
    private destroy$: DestroyService,
    private userAgentService: UserAgentService,
    private commonService: CommonService,
    private optionService: OptionService,
    private linkService: LinkService
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
    this.getFooterLinks();
  }

  private getFooterLinks() {
    this.linkService
      .getFooterLinks()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => (this.footerLinks = res));
  }
}
