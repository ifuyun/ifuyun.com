import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
import { LinkEntity } from 'src/app/interfaces/link';
import { OptionEntity } from 'src/app/interfaces/option';
import { DestroyService } from 'src/app/services/destroy.service';
import { LinkService } from 'src/app/services/link.service';
import { OptionService } from 'src/app/services/option.service';
import { UrlService } from 'src/app/services/url.service';
import { UserAgentService } from 'src/app/services/user-agent.service';

@Component({
  selector: 'app-footer',
  imports: [NgFor, NgIf, RouterLink],
  providers: [DestroyService],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.less'
})
export class FooterComponent implements OnInit {
  isMobile = false;
  options: OptionEntity = {};
  footerLinks: LinkEntity[] = [];
  friendLinks: LinkEntity[] = [];

  get copyright() {
    if (this.options['copyright_notice']) {
      return this.options['copyright_notice'].replace('$now', new Date().getFullYear() + '');
    }
    return '';
  }

  get recordCode() {
    if (this.options['record_code']) {
      return this.options['record_code'].replace(/[^\d]/gi, '');
    }
    return '';
  }

  private isLoaded = false;
  private isHome = false;
  private isHomeChanged = false;

  constructor(
    private readonly destroy$: DestroyService,
    private readonly userAgentService: UserAgentService,
    private readonly optionService: OptionService,
    private readonly linkService: LinkService,
    private readonly urlService: UrlService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngOnInit(): void {
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => (this.options = options));
    this.getFooterLinks();
    this.urlService.urlInfo$.pipe(takeUntil(this.destroy$)).subscribe((url) => {
      const isHome = url.current.split('?')[0] === '/';

      this.isHomeChanged = isHome !== this.isHome;
      if (!this.isLoaded || this.isHomeChanged) {
        this.isHome = isHome;

        if (!this.isMobile) {
          this.getFriendLinks();
        }
      }
      this.isLoaded = true;
    });
  }

  private getFooterLinks() {
    this.linkService
      .getFooterLinks()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.footerLinks = (res || []).map((item) => {
          return {
            ...item,
            isExternal: /^https?:\/\//i.test(item.linkUrl)
          };
        });
      });
  }

  private getFriendLinks() {
    this.linkService
      .getFriendLinks(this.isHome)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.friendLinks = res;
      });
  }
}
