import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AppConfigService, DestroyService, OptionEntity, UrlService, UserAgentService } from 'common/core';
import { LinkVo } from 'common/interfaces';
import { LinkService, OptionService } from 'common/services';
import { isEmpty } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
import { SmartLinkComponent } from '../smart-link/smart-link.component';

@Component({
  selector: 'lib-footer',
  imports: [SmartLinkComponent],
  providers: [DestroyService],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.less'
})
export class FooterComponent implements OnInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly uaService = inject(UserAgentService);
  private readonly appConfigService = inject(AppConfigService);
  private readonly optionService = inject(OptionService);
  private readonly linkService = inject(LinkService);
  private readonly urlService = inject(UrlService);

  readonly isMobile = this.uaService.isMobile;
  readonly wwwHost = this.appConfigService.apps['www'].url;
  readonly options = signal<OptionEntity>({});
  readonly footerLinks = signal<LinkVo[]>([]);
  readonly friendLinks = signal<LinkVo[]>([]);
  readonly copyright = computed(() => {
    const copyright = this.options()['copyright_notice'];

    if (copyright) {
      return copyright.replace('$now', new Date().getFullYear() + '');
    }
    return '';
  });
  readonly recordCode = computed(() => {
    const recordCode = this.options()['record_code'];

    if (recordCode) {
      return recordCode.replace(/[^\d]/gi, '');
    }
    return '';
  });

  private readonly isLoaded = signal(false);
  private readonly isHome = signal(false);
  private readonly isHomeChanged = signal(false);

  ngOnInit(): void {
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => this.options.set(options));

    this.getFooterLinks();

    this.urlService.urlInfo$.pipe(takeUntil(this.destroy$)).subscribe((url) => {
      const isHome = url.current.split('?')[0] === '/';

      this.isHomeChanged.set(isHome !== this.isHome());
      if (!this.isLoaded() || this.isHomeChanged()) {
        this.isHome.set(isHome);

        if (!this.isMobile) {
          this.getFriendLinks();
        }
      }
      this.isLoaded.set(true);
    });
  }

  private getFooterLinks() {
    this.linkService
      .getFooterLinks()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.footerLinks.set(
          (res || []).map((item) => {
            return {
              ...item,
              isExternal: /^https?:\/\//i.test(item.url)
            };
          })
        );
      });
  }

  private getFriendLinks() {
    this.linkService
      .getFriendLinks(this.isHome())
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.friendLinks.set(res);
      });
  }
}
