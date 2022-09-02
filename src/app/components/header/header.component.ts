import { DOCUMENT } from '@angular/common';
import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ResponseCode } from '../../config/response-code.enum';
import { CommonService } from '../../core/common.service';
import { UserAgentService } from '../../core/user-agent.service';
import { OptionEntity } from '../../interfaces/options';
import { TaxonomyNode } from '../../interfaces/taxonomies';
import { UserModel } from '../../interfaces/users';
import { AuthService } from '../../services/auth.service';
import { OptionsService } from '../../services/options.service';
import { UsersService } from '../../services/users.service';

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
  isFirefox = false;
  activePage = '';
  options: OptionEntity = {};
  showSearch = false;
  keyword = '';
  focusSearch = false;
  user!: UserModel;
  isLoggedIn = false;

  private optionsListener!: Subscription;
  private commonListener!: Subscription;
  private userListener!: Subscription;
  private logoutListener!: Subscription;

  constructor(
    private optionsService: OptionsService,
    private commonService: CommonService,
    private userAgentService: UserAgentService,
    private usersService: UsersService,
    private authService: AuthService,
    private router: Router,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.isMobile = this.userAgentService.isMobile();
    this.isFirefox = this.userAgentService.isFirefox();
  }

  ngOnInit(): void {
    this.optionsListener = this.optionsService.options$.subscribe((options) => (this.options = options));
    this.commonListener = this.commonService.pageIndex$.subscribe((pageIndex) => (this.activePage = pageIndex));
    this.userListener = this.usersService.loginUser$.subscribe((user) => {
      this.user = user;
      this.isLoggedIn = !!this.user.userId;
    });
  }

  ngOnDestroy(): void {
    this.optionsListener.unsubscribe();
    this.commonListener.unsubscribe();
    this.userListener.unsubscribe();
    this.logoutListener?.unsubscribe();
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

  logout() {
    this.logoutListener = this.authService.logout().subscribe((res) => {
      if (res.code === ResponseCode.SUCCESS) {
        location.reload();
      }
    });
  }
}
