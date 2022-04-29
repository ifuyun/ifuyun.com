import { DOCUMENT } from '@angular/common';
import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonService } from '../../core/common.service';
import { UserAgentService } from '../../core/user-agent.service';
import { OptionEntity } from '../../interfaces/options';
import { TaxonomyNode } from '../../interfaces/taxonomies';
import { OptionsService } from '../../services/options.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.less']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() taxonomies: TaxonomyNode[] = [];
  @Input() siderOpen = false;
  @Output() siderOpenChange = new EventEmitter<boolean>();

  isMobile = false;
  activePage = '';
  options: OptionEntity = {};
  showSearch = false;
  keyword = '';
  focusSearch = false;

  private optionsListener!: Subscription;
  private commonListener!: Subscription;

  constructor(
    private optionsService: OptionsService,
    private commonService: CommonService,
    private userAgentService: UserAgentService,
    private router: Router,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.optionsListener = this.optionsService.options$.subscribe((options) => this.options = options);
    this.commonListener = this.commonService.pageIndex$.subscribe((pageIndex) => this.activePage = pageIndex);
  }

  ngOnDestroy(): void {
    this.optionsListener.unsubscribe();
    this.commonListener.unsubscribe();
  }

  toggleSearchStatus() {
    this.showSearch = !this.showSearch;
    this.focusSearch = this.showSearch;
  }

  search() {
    this.keyword = this.keyword.trim();
    if (this.keyword) {
      this.showSearch = false;
      this.router.navigate(['/'], { queryParams: { keyword: this.keyword } });
    }
  }

  toggleSiderOpen() {
    this.siderOpen = !this.siderOpen;
    this.siderOpenChange.emit(this.siderOpen);
    this.document.body.style.overflow = 'hidden';
  }
}
