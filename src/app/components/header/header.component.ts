import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { skipWhile, takeUntil } from 'rxjs';
import { ADMIN_URL_PARAM, APP_ID } from '../../config/common.constant';
import { TaxonomyNode } from '../../interfaces/taxonomy';
import { TenantAppModel } from '../../interfaces/tenant-app';
import { UserModel } from '../../interfaces/user';
import { TOOL_LINKS } from '../../pages/tool/tool.constant';
import { AuthService } from '../../services/auth.service';
import { CommonService } from '../../services/common.service';
import { DestroyService } from '../../services/destroy.service';
import { PlatformService } from '../../services/platform.service';
import { TenantAppService } from '../../services/tenant-app.service';
import { UserService } from '../../services/user.service';
import { format } from '../../utils/helper';

@Component({
  selector: 'app-header',
  imports: [RouterLink, CommonModule, FormsModule, NzInputModule, NzIconModule, NzButtonModule],
  providers: [DestroyService],
  templateUrl: './header.component.html',
  styleUrl: './header.component.less'
})
export class HeaderComponent implements OnInit, AfterViewInit {
  @Input() postTaxonomies: TaxonomyNode[] = [];

  @ViewChild('searchInput') searchInput!: ElementRef;

  appInfo?: TenantAppModel;
  isMobile = false;
  isSignIn = false;
  activePage = '';
  user!: UserModel;
  adminUrl = '';
  toolLinks = TOOL_LINKS;
  keyword = '';

  get isPostPage() {
    return ['post', 'post-archive'].includes(this.activePage);
  }

  get isWallpaperPage() {
    return ['wallpaper', 'wallpaper-archive'].includes(this.activePage);
  }

  private inputFlag = false;

  constructor(
    private readonly router: Router,
    private readonly destroy$: DestroyService,
    private readonly platform: PlatformService,
    private readonly message: NzMessageService,
    private readonly commonService: CommonService,
    private readonly tenantAppService: TenantAppService,
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  ngOnInit(): void {
    this.tenantAppService.appInfo$
      .pipe(
        skipWhile((appInfo) => isEmpty(appInfo)),
        takeUntil(this.destroy$)
      )
      .subscribe((appInfo) => {
        this.appInfo = appInfo;

        if (this.platform.isBrowser) {
          this.adminUrl = this.appInfo.appAdminUrl + format(ADMIN_URL_PARAM, this.authService.getToken(), APP_ID);
        }
      });
    this.commonService.activePage$.pipe(takeUntil(this.destroy$)).subscribe((page) => (this.activePage = page));
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user = user;
      this.isSignIn = !!user.userId;
    });
  }

  ngAfterViewInit() {
    const $searchInput = <HTMLInputElement>this.searchInput?.nativeElement;
    if ($searchInput) {
      $searchInput.addEventListener('compositionstart', () => (this.inputFlag = true), false);
      $searchInput.addEventListener('compositionend', () => (this.inputFlag = false), false);
    }
  }

  onKeyDown(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    const isCtrlPressed = e.altKey || e.ctrlKey || e.metaKey || e.shiftKey;

    if (key === 'enter' && !isCtrlPressed && !this.inputFlag) {
      this.search();
    }
  }

  search(): void {
    this.keyword = this.keyword.trim();
    if (!this.keyword) {
      this.message.error('请输入搜索关键词');
      return;
    }
    this.router.navigate(['/search'], {
      queryParams: {
        keyword: this.keyword
      }
    });
  }
}
