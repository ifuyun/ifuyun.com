import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
import { ADMIN_URL_PARAM, APP_ID, PATH_LOGO, PATH_LOGO_DARK } from '../../config/common.constant';
import { ResponseCode } from '../../config/response-code.enum';
import { CommonService } from '../../core/common.service';
import { DestroyService } from '../../core/destroy.service';
import { PlatformService } from '../../core/platform.service';
import { UserAgentService } from '../../core/user-agent.service';
import { AutofocusDirective } from '../../directives/autofocus.directive';
import { format } from '../../helpers/helper';
import { ActionType, ActionObjectType } from '../../interfaces/log.enum';
import { TaxonomyNode } from '../../interfaces/taxonomy.interface';
import { TenantAppModel } from '../../interfaces/tenant-app.interface';
import { UserModel } from '../../interfaces/user.interface';
import { NgZorroAntdModule } from '../../modules/antd/ng-zorro-antd.module';
import { TOOL_LINKS } from '../../pages/tool/tool.constant';
import { AuthService } from '../../pages/user/auth.service';
import { UserService } from '../../pages/user/user.service';
import { LogService } from '../../services/log.service';
import { TenantAppService } from '../../services/tenant-app.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.less'],
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, AutofocusDirective, NgZorroAntdModule],
  providers: [DestroyService]
})
export class HeaderComponent implements OnInit {
  @Input() postTaxonomies: TaxonomyNode[] = [];
  @Input() siderOpen = false;
  @Output() siderOpenChange = new EventEmitter<boolean>();

  appInfo!: TenantAppModel;
  isMobile = false;
  isFirefox = false;
  activePage = '';
  showSearch = false;
  keyword = '';
  focusSearch = false;
  user!: UserModel;
  isLoggedIn = false;
  showHeader = true;
  showMobileHeader = true;
  toolLinks = TOOL_LINKS;
  logoPath = '';
  adminUrl = '';

  constructor(
    private router: Router,
    private destroy$: DestroyService,
    private userAgentService: UserAgentService,
    private platform: PlatformService,
    private commonService: CommonService,
    private tenantAppService: TenantAppService,
    private userService: UserService,
    private authService: AuthService,
    private logService: LogService
  ) {
    this.isMobile = this.userAgentService.isMobile();
    this.isFirefox = this.userAgentService.isFirefox();
  }

  ngOnInit(): void {
    this.commonService.darkMode$.pipe(takeUntil(this.destroy$)).subscribe((darkMode) => {
      this.logoPath = darkMode ? PATH_LOGO_DARK : PATH_LOGO;
    });
    this.tenantAppService.appInfo$
      .pipe(
        skipWhile((appInfo) => isEmpty(appInfo)),
        takeUntil(this.destroy$)
      )
      .subscribe((appInfo) => {
        this.appInfo = appInfo;

        if (this.platform.isBrowser) {
          this.adminUrl =
            this.appInfo.appAdminUrl +
            format(ADMIN_URL_PARAM, this.authService.getToken(), this.authService.getExpiration(), APP_ID);
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
      this.logService
        .logAction({
          action: ActionType.SEARCH,
          objectType: ActionObjectType.SEARCH,
          keyword: this.keyword,
          appId: APP_ID
        })
        .subscribe();
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
