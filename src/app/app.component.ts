import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { PlatformService } from './core/platform.service';
import { UrlService } from './core/url.service';
import { UserAgentService } from './core/user-agent.service';
import { TaxonomyNode } from './interfaces/taxonomy.interface';
import { LogService } from './services/log.service';
import { OptionService } from './services/option.service';
import { TaxonomyService } from './services/taxonomy.service';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {
  isMobile = false;
  taxonomies: TaxonomyNode[] = [];
  siderOpen = false;

  private currentUrl = '';
  private initialized = false;

  constructor(
    private router: Router,
    private urlService: UrlService,
    private optionService: OptionService,
    private userService: UserService,
    private taxonomyService: TaxonomyService,
    private logService: LogService,
    private platform: PlatformService,
    private userAgentService: UserAgentService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      const previous = this.currentUrl.split('#')[0];
      const current = (event as NavigationEnd).url.split('#')[0];
      if (previous !== current) {
        this.urlService.updatePreviousUrl({
          previous: this.currentUrl,
          current: (event as NavigationEnd).url
        });
        if (this.platform.isBrowser) {
          this.logService.logAccess(this.logService.parseAccessLog(this.initialized, this.currentUrl)).subscribe();
        }
        this.currentUrl = (event as NavigationEnd).url;
      }
      this.initialized = true;
      this.siderOpen = false;
      this.onSiderOpenChange(false);
    });
    this.optionService.getOptions().subscribe();
    this.userService.getLoginUser().subscribe();
    this.taxonomyService.getTaxonomies().subscribe((taxonomies) => (this.taxonomies = taxonomies));
  }

  toggleSiderOpen() {
    this.siderOpen = !this.siderOpen;
    this.onSiderOpenChange(this.siderOpen);
  }

  onSiderOpenChange(open: boolean) {
    const htmlNode = this.document.getElementsByTagName('html')[0];
    if (open) {
      htmlNode.classList.add('cdk-global-scrollblock');
    } else {
      htmlNode.classList.remove('cdk-global-scrollblock');
    }
  }
}
