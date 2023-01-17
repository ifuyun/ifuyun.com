import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { isEmpty } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
import { ADMIN_URL_PARAM, LOGO_DARK_PATH, LOGO_PATH } from '../../config/common.constant';
import { ResponseCode } from '../../config/response-code.enum';
import { CommonService } from '../../core/common.service';
import { DestroyService } from '../../core/destroy.service';
import { PlatformService } from '../../core/platform.service';
import { UserAgentService } from '../../core/user-agent.service';
import { format } from '../../helpers/helper';
import { OptionEntity } from '../../interfaces/option.interface';
import { TaxonomyNode } from '../../interfaces/taxonomy.interface';
import { UserModel } from '../../interfaces/user.interface';
import { TOOL_LINKS } from '../../pages/tool/tool.constant';
import { AuthService } from '../../services/auth.service';
import { OptionService } from '../../services/option.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.less'],
  providers: [DestroyService]
})
export class HeaderComponent implements OnInit {
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
  showHeader = true;
  showMobileHeader = true;
  toolLinks = TOOL_LINKS;
  logoPath = LOGO_PATH;
  adminUrl = '';

  constructor(
    private router: Router,
    private destroy$: DestroyService,
    private userAgentService: UserAgentService,
    private platform: PlatformService,
    private commonService: CommonService,
    private optionService: OptionService,
    private userService: UserService,
    private authService: AuthService
  ) {
    this.isMobile = this.userAgentService.isMobile();
    this.isFirefox = this.userAgentService.isFirefox();
  }

  ngOnInit(): void {
    this.commonService.darkMode$.pipe(takeUntil(this.destroy$)).subscribe((darkMode) => {
      this.logoPath = darkMode ? LOGO_DARK_PATH : LOGO_PATH;
    });
    this.optionService.options$
      .pipe(
        takeUntil(this.destroy$),
        skipWhile((options) => isEmpty(options))
      )
      .subscribe((options) => {
        this.options = options;
        this.adminUrl = this.options['admin_site_url'];
        if (this.platform.isBrowser) {
          this.adminUrl += format(ADMIN_URL_PARAM, this.authService.getToken(), this.authService.getExpiration());
        }
      });
    this.commonService.pageIndex$
      .pipe(takeUntil(this.destroy$))
      .subscribe((pageIndex) => (this.activePage = pageIndex));
    this.commonService.pageOptions$.pipe(takeUntil(this.destroy$)).subscribe((options) => {
      this.showHeader = options.showHeader;
      this.showMobileHeader = options.showMobileHeader;
    });
    this.userService.loginUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user = user;
      this.isLoggedIn = !!user.userId;
    });
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
  }

  logout() {
    this.authService
      .logout()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.code === ResponseCode.SUCCESS) {
          location.reload();
        }
      });
  }
}
