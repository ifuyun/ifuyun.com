import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { PlatformService } from './core/platform.service';
import { UrlService } from './core/url.service';
import { LogService } from './services/log.service';
import { OptionService } from './services/option.service';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {
  private currentUrl = '';
  private initialized = false;

  constructor(
    private router: Router,
    private urlService: UrlService,
    private optionService: OptionService,
    private userService: UserService,
    private logService: LogService,
    private platform: PlatformService
  ) {}

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
    });
    this.optionService.getOptions().subscribe();
    this.userService.getLoginUser().subscribe();
  }
}
