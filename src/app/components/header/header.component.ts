import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { isEmpty } from 'lodash';
import * as QRCode from 'qrcode';
import { skipWhile, takeUntil } from 'rxjs';
import { LOGO_DARK_PATH, LOGO_PATH } from '../../config/common.constant';
import { ResponseCode } from '../../config/response-code.enum';
import { CommonService } from '../../core/common.service';
import { DestroyService } from '../../core/destroy.service';
import { UserAgentService } from '../../core/user-agent.service';
import { OptionEntity } from '../../interfaces/option.interface';
import { TaxonomyNode } from '../../interfaces/taxonomy.interface';
import { UserModel } from '../../interfaces/user.interface';
import { TOOL_LINKS } from '../../pages/tool/tool.constant';
import { AuthService } from '../../services/auth.service';
import { OptionService } from '../../services/option.service';
import { UserService } from '../../services/user.service';
import { ImageService } from '../image/image.service';
import { MessageService } from '../message/message.service';

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

  constructor(
    private router: Router,
    private destroy$: DestroyService,
    private userAgentService: UserAgentService,
    private commonService: CommonService,
    private optionService: OptionService,
    private userService: UserService,
    private authService: AuthService,
    private imageService: ImageService,
    private message: MessageService
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
      .subscribe((options) => (this.options = options));
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

  showAlipayRedPacketQrcode() {
    QRCode.toCanvas(this.options['alipay_red_packet_code'], {
      width: 320,
      margin: 0
    })
      .then((canvas) => {
        this.imageService.preview([
          {
            src: canvas.toDataURL(),
            padding: 16
          }
        ]);
      })
      .catch((err) => this.message.error(err));
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
