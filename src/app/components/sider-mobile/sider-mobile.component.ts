import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
import {
  ADMIN_URL_PARAM,
  PATH_FAVICON,
  PATH_WECHAT_CARD,
  PATH_WECHAT_MINI_APP_CARD
} from '../../config/common.constant';
import { Theme } from '../../config/common.enum';
import { ResponseCode } from '../../config/response-code.enum';
import { CommonService } from '../../core/common.service';
import { DestroyService } from '../../core/destroy.service';
import { PlatformService } from '../../core/platform.service';
import { UserAgentService } from '../../core/user-agent.service';
import { format } from '../../helpers/helper';
import { OptionEntity } from '../../interfaces/option.interface';
import { UserModel } from '../../interfaces/user.interface';
import { AuthService } from '../../services/auth.service';
import { OptionService } from '../../services/option.service';
import { UserService } from '../../services/user.service';
import { ImageService } from '../image/image.service';

@Component({
  selector: 'app-sider-mobile',
  templateUrl: './sider-mobile.component.html',
  styleUrls: ['./sider-mobile.component.less'],
  standalone: true,
  imports: [NgClass, NgFor, NgIf, RouterLink]
})
export class SiderMobileComponent implements OnInit {
  @Input() siderOpen = false;
  @Output() siderOpenChange = new EventEmitter<boolean>();

  readonly logoUrl = PATH_FAVICON;

  darkMode = false;
  isMobile = false;
  activePage = '';
  options: OptionEntity = {};
  user!: UserModel;
  isLoggedIn = false;
  adminUrl = '';

  constructor(
    private destroy$: DestroyService,
    private userAgentService: UserAgentService,
    private platform: PlatformService,
    private commonService: CommonService,
    private optionService: OptionService,
    private userService: UserService,
    private authService: AuthService,
    private imageService: ImageService
  ) {
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.commonService.darkMode$.pipe(takeUntil(this.destroy$)).subscribe((darkMode) => {
      this.darkMode = darkMode;
    });
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
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
    this.userService.loginUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user = user;
      this.isLoggedIn = !!this.user.userId;
    });
  }

  changeTheme() {
    const theme = this.darkMode ? Theme.Light : Theme.Dark;
    this.commonService.updateTheme(theme);
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

  showWechatQrcode() {
    this.siderOpen = false;
    this.siderOpenChange.emit(this.siderOpen);
    this.imageService.preview([
      {
        src: PATH_WECHAT_CARD
      }
    ]);
  }

  showMiniAppCode() {
    this.siderOpen = false;
    this.siderOpenChange.emit(this.siderOpen);
    this.imageService.preview([
      {
        src: PATH_WECHAT_MINI_APP_CARD
      }
    ]);
  }
}
