import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { isEmpty } from 'lodash';
import { skipWhile, Subscription } from 'rxjs';
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

  isMobile = false;
  activePage = '';
  options: OptionEntity = {};
  user!: UserModel;
  isLoggedIn = false;

  private optionsListener!: Subscription;
  private commonListener!: Subscription;
  private userListener!: Subscription;
  private logoutListener!: Subscription;

  constructor(
    private optionService: OptionService,
    private commonService: CommonService,
    private userAgentService: UserAgentService,
    private userService: UserService,
    private authService: AuthService,
    private imageService: ImageService
  ) {
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
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
    this.optionsListener.unsubscribe();
    this.commonListener.unsubscribe();
    this.userListener.unsubscribe();
    this.logoutListener?.unsubscribe();
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
        src: '/assets/images/wechat.jpg'
      }
    ]);
  }
}
