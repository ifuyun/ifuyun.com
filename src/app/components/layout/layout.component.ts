import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { PlatformService } from '../../core/platform.service';
import { UserAgentService } from '../../core/user-agent.service';
import { TaxonomyNode } from '../../interfaces/taxonomies';
import { TaxonomiesService } from '../../services/taxonomies.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.less']
})
export class LayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  isMobile = false;
  taxonomies: TaxonomyNode[] = [];
  siderOpen = false;

  private taxonomiesListener!: Subscription;

  constructor(
    private userAgentService: UserAgentService,
    private taxonomiesService: TaxonomiesService,
    private router: Router,
    private platform: PlatformService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.siderOpen = false;
      this.document.body.style.overflow = '';
    });
    this.taxonomiesListener = this.taxonomiesService.getTaxonomies()
      .subscribe((taxonomies) => this.taxonomies = taxonomies);
  }

  ngAfterViewInit() {
    if (this.platform.isBrowser && !this.isMobile) {
      const siderEle = this.document.getElementById('sider') as HTMLElement;
      const documentEle = this.document.documentElement;
      const scrollFn = (siderEle: HTMLElement) => {
        if (documentEle.scrollTop > 0 && documentEle.scrollTop > siderEle.scrollHeight - documentEle.clientHeight) {
          siderEle.style.position = 'sticky';
          siderEle.style.top = (documentEle.clientHeight - siderEle.scrollHeight - 16) + 'px';
        } else {
          siderEle.style.position = 'relative';
          siderEle.style.top = '';
        }
      };
      window.addEventListener('scroll', () => scrollFn(siderEle));
      window.addEventListener('resize', () => scrollFn(siderEle));
    }
  }

  ngOnDestroy(): void {
    this.taxonomiesListener.unsubscribe();
  }

  toggleSiderOpen() {
    this.siderOpen = !this.siderOpen;
    this.document.body.style.overflow = this.siderOpen ? 'hidden' : '';
  }
}
