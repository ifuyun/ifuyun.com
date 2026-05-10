import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ADMIN_URL_PARAM,
  AppConfigService,
  AppDomainConfig,
  AuthService,
  DestroyService,
  PageIndexInfo,
  ResponseCode,
  UserAgentService,
  UserModel
} from 'common/core';
import { SearchType, TaxonomyType } from 'common/enums';
import { TaxonomyNode, TenantAppModel } from 'common/interfaces';
import { CommonService, TaxonomyService, TenantAppService, UserService } from 'common/services';
import { format } from 'common/utils';
import { isEmpty } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { skipWhile, takeUntil } from 'rxjs';
import { SmartLinkComponent } from '../smart-link/smart-link.component';
import { TOOL_LINKS } from './tool.constant';

@Component({
  selector: 'lib-header',
  imports: [FormsModule, NzInputModule, NzIconModule, NzButtonModule, NzSelectModule, SmartLinkComponent],
  providers: [DestroyService],
  templateUrl: './header.component.html',
  styleUrl: './header.component.less'
})
export class HeaderComponent implements OnInit, AfterViewChecked {
  @ViewChild('mSearchInput') mSearchInput!: ElementRef;

  readonly faviconUrl: string;
  readonly magazineUrl: string;
  readonly searchTypeMap: Record<string, string> = {
    [SearchType.ALL]: '全站',
    [SearchType.POST]: '博客',
    [SearchType.WALLPAPER]: '壁纸',
    [SearchType.GAME]: '游戏'
  };

  isMobile = false;
  isSignIn = false;
  domains!: AppDomainConfig;
  indexInfo?: PageIndexInfo;
  appInfo?: TenantAppModel;
  user!: UserModel;
  postTaxonomies: TaxonomyNode[] = [];
  gameTaxonomies: TaxonomyNode[] = [];
  toolLinks = TOOL_LINKS;
  keyword = '';
  searchType = 'all';
  searchVisible = false;
  isFocused = false;

  private adminUrl = '';

  constructor(
    private readonly destroy$: DestroyService,
    private readonly userAgentService: UserAgentService,
    private readonly message: NzMessageService,
    private readonly commonService: CommonService,
    private readonly appConfigService: AppConfigService,
    private readonly tenantAppService: TenantAppService,
    private readonly taxonomyService: TaxonomyService,
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {
    this.domains = appConfigService.apps;
    this.faviconUrl = appConfigService.faviconUrl;
    this.magazineUrl = appConfigService.magazineUrl;
    this.isMobile = userAgentService.isMobile;
  }

  ngOnInit(): void {
    this.tenantAppService.appInfo$
      .pipe(
        skipWhile((appInfo) => isEmpty(appInfo)),
        takeUntil(this.destroy$)
      )
      .subscribe((appInfo) => {
        const urlParam = format(ADMIN_URL_PARAM, this.authService.getToken(), this.appConfigService.appId);

        this.appInfo = appInfo;
        if (this.appInfo.appAdminUrl) {
          this.adminUrl = this.appInfo.appAdminUrl + '?' + urlParam;
        }
      });
    this.taxonomyService.getTaxonomies().subscribe((taxonomies) => (this.postTaxonomies = taxonomies));
    this.taxonomyService.getTaxonomies(TaxonomyType.GAME).subscribe((taxonomies) => (this.gameTaxonomies = taxonomies));
    this.commonService.pageIndex$.pipe(takeUntil(this.destroy$)).subscribe((page) => {
      this.indexInfo = this.commonService.getPageIndexInfo(page);
    });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user = user;
      this.isSignIn = !!user.userId;
    });
  }

  ngAfterViewChecked(): void {
    if (!this.isFocused && this.mSearchInput) {
      this.mSearchInput.nativeElement.focus();
      this.isFocused = true;
    }
  }

  search(): void {
    this.keyword = this.keyword.trim();
    if (!this.keyword) {
      this.message.error('请输入搜索关键词');
      if (this.isMobile) {
        this.mSearchInput.nativeElement.focus();
      }
      return;
    }
    this.commonService.smartNavigate('/search', this.domains['www'].url, {
      queryParams: {
        type: this.searchType === 'all' ? undefined : this.searchType,
        keyword: this.keyword
      }
    });
  }

  showSearch() {
    this.searchVisible = true;
  }

  hideSearch() {
    this.searchVisible = false;
    this.isFocused = false;
  }

  gotoAdmin() {
    window.open(this.adminUrl);
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

  showSider() {
    this.commonService.updateSiderVisible(true);
  }
}
