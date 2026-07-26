import { AfterViewChecked, Component, ElementRef, inject, model, OnInit, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ADMIN_URL_PARAM,
  AppConfigService,
  AuthService,
  DestroyService,
  PageIndexInfo,
  ResponseCode,
  UserAgentService,
  UserModel
} from 'common/core';
import { CategoryType, SearchType } from 'common/enums';
import { CategoryNode, TenantAppVo } from 'common/interfaces';
import { CategoryService, CommonService, TenantAppService, UserService } from 'common/services';
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
  private readonly destroy$ = inject(DestroyService);
  private readonly uaService = inject(UserAgentService);
  private readonly message = inject(NzMessageService);
  private readonly commonService = inject(CommonService);
  private readonly appConfigService = inject(AppConfigService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly categoryService = inject(CategoryService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);

  readonly mSearchInput = viewChild<ElementRef<HTMLInputElement>>('mSearchInput');

  readonly domains = this.appConfigService.apps;
  readonly faviconUrl = this.appConfigService.faviconUrl;
  readonly magazineUrl = this.appConfigService.magazineUrl;
  readonly isMobile = this.uaService.isMobile;
  readonly searchTypeMap: Record<string, string> = {
    [SearchType.ALL]: '全站',
    [SearchType.POST]: '博客',
    [SearchType.WALLPAPER]: '壁纸',
    [SearchType.GAME]: '游戏'
  };

  readonly isSignIn = signal(false);
  readonly indexInfo = signal<PageIndexInfo | null>(null);
  readonly appInfo = signal<TenantAppVo | null>(null);
  readonly user = signal<UserModel | null>(null);
  readonly postCategories = signal<CategoryNode[]>([]);
  readonly gameCategories = signal<CategoryNode[]>([]);
  readonly toolLinks = TOOL_LINKS;
  readonly keyword = model('');
  readonly searchType = model('all');
  readonly searchVisible = signal(false);
  readonly isFocused = signal(false);

  private readonly adminUrl = signal('');

  ngOnInit(): void {
    this.tenantAppService.appInfo$
      .pipe(
        skipWhile((appInfo) => isEmpty(appInfo)),
        takeUntil(this.destroy$)
      )
      .subscribe((appInfo) => {
        const urlParam = format(ADMIN_URL_PARAM, this.authService.getToken(), this.appConfigService.appId);

        this.appInfo.set(appInfo);
        if (appInfo.adminUrl) {
          this.adminUrl.set(appInfo.adminUrl + '?' + urlParam);
        }
      });
    this.categoryService.getCategories().subscribe((categories) => this.postCategories.set(categories));
    this.categoryService
      .getCategories(CategoryType.GAME)
      .subscribe((categories) => this.gameCategories.set(categories));
    this.commonService.pageIndex$.pipe(takeUntil(this.destroy$)).subscribe((page) => {
      this.indexInfo.set(this.commonService.getPageIndexInfo(page));
    });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user.set(user);
      this.isSignIn.set(!!user.id);
    });
  }

  ngAfterViewChecked(): void {
    const $input = this.mSearchInput();
    if (!this.isFocused() && $input) {
      $input.nativeElement.focus();

      this.isFocused.set(true);
    }
  }

  search(): void {
    const keyword = this.keyword().trim();
    if (!keyword) {
      this.message.error('请输入搜索关键词');

      if (this.isMobile) {
        this.mSearchInput()?.nativeElement.focus();
      }
      return;
    }
    this.commonService.smartNavigate('/search', this.domains['www'].url, {
      queryParams: {
        type: this.searchType() === 'all' ? undefined : this.searchType(),
        keyword
      }
    });
  }

  showSearch() {
    this.searchVisible.set(true);
  }

  hideSearch() {
    this.searchVisible.set(false);
    this.isFocused.set(false);
  }

  gotoAdmin() {
    window.open(this.adminUrl());
  }

  signout() {
    this.authService
      .signout()
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
