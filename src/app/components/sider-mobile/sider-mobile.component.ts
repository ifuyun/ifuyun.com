import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { isEmpty } from 'lodash';
import { skipWhile, Subscription } from 'rxjs';
import { WECHAT_QRCODE_PATH } from '../../config/common.constant';
import { Theme } from '../../config/common.enum';
import { ResponseCode } from '../../config/response-code.enum';
import { CommonService } from '../../core/common.service';
import { UserAgentService } from '../../core/user-agent.service';
import { OptionEntity } from '../../interfaces/option.interface';
import { TaxonomyNode } from '../../interfaces/taxonomy.interface';
import { UserModel } from '../../interfaces/user.interface';
import { AuthService } from '../../services/auth.service';
import { OptionService } from '../../services/option.service';
import { UserService } from '../../services/user.service';
import { ImageService } from '../image/image.service';

@Component({
  selector: 'app-sider-mobile',
  templateUrl: './sider-mobile.component.html',
  styleUrls: ['./sider-mobile.component.less']
})
export class SiderMobileComponent implements OnInit, OnDestroy {
  @Input() taxonomies: TaxonomyNode[] = [];
  @Input() siderOpen = false;
  @Output() siderOpenChange = new EventEmitter<boolean>();

  darkMode = false;
  isMobile = false;
  activePage = '';
  options: OptionEntity = {};
  user!: UserModel;
  isLoggedIn = false;

  private darkModeListener!: Subscription;
  private optionsListener!: Subscription;
  private commonListener!: Subscription;
  private userListener!: Subscription;
  private logoutListener!: Subscription;

  constructor(
    private userAgentService: UserAgentService,
    private commonService: CommonService,
    private optionService: OptionService,
    private userService: UserService,
    private authService: AuthService,
    private imageService: ImageService
  ) {
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.darkModeListener = this.commonService.darkMode$.subscribe((darkMode) => {
      this.darkMode = darkMode;
    });
    this.optionsListener = this.optionService.options$
      .pipe(skipWhile((options) => isEmpty(options)))
      .subscribe((options) => (this.options = options));
    this.commonListener = this.commonService.pageIndex$.subscribe((pageIndex) => (this.activePage = pageIndex));
    this.userListener = this.userService.loginUser$.subscribe((user) => {
      this.user = user;
      this.isLoggedIn = !!this.user.userId;
    });
  }

  ngOnDestroy(): void {
    this.darkModeListener.unsubscribe();
    this.optionsListener.unsubscribe();
    this.commonListener.unsubscribe();
    this.userListener.unsubscribe();
    this.logoutListener?.unsubscribe();
  }

  changeTheme() {
    const theme = this.darkMode ? Theme.Light : Theme.Dark;
    this.commonService.updateTheme(theme);
  }

  logout() {
    this.logoutListener = this.authService.logout().subscribe((res) => {
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
        src: WECHAT_QRCODE_PATH
      }
    ]);
  }
}
