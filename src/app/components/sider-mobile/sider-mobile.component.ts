import { Component, Input, OnDestroy, OnInit } from '@angular/core';
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
  selector: 'app-sider-mobile',
  templateUrl: './sider-mobile.component.html',
  styleUrls: ['./sider-mobile.component.less']
})
export class SiderMobileComponent implements OnInit, OnDestroy {
  @Input() taxonomies: TaxonomyNode[] = [];
  @Input() siderOpen = false;

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
    private optionsService: OptionsService,
    private commonService: CommonService,
    private userAgentService: UserAgentService,
    private usersService: UsersService,
    private authService: AuthService
  ) {
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.optionsListener = this.optionsService.options$.subscribe((options) => this.options = options);
    this.commonListener = this.commonService.pageIndex$.subscribe((pageIndex) => this.activePage = pageIndex);
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

  logout() {
    this.logoutListener = this.authService.logout().subscribe((res) => {
      if (res.code === ResponseCode.SUCCESS) {
        location.reload();
      }
    });
  }
}
