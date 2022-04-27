import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { UserAgentService } from '../../core/user-agent.service';
import { TaxonomyNode } from '../../interfaces/taxonomies';
import { TaxonomiesService } from '../../services/taxonomies.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.less']
})
export class LayoutComponent implements OnInit, OnDestroy {
  isMobile: boolean = false;
  taxonomies: TaxonomyNode[] = [];
  siderOpen = false;

  private taxonomiesListener!: Subscription;

  constructor(
    private userAgentService: UserAgentService,
    private taxonomiesService: TaxonomiesService,
    private router: Router,
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

  ngOnDestroy(): void {
    this.taxonomiesListener.unsubscribe();
  }

  toggleSiderOpen() {
    this.siderOpen = !this.siderOpen;
    this.document.body.style.overflow = this.siderOpen ? 'hidden' : '';
  }
}
