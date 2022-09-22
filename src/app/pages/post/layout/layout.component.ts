import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, Inject } from '@angular/core';
import { PlatformService } from '../../../core/platform.service';
import { UserAgentService } from '../../../core/user-agent.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.less']
})
export class LayoutComponent implements AfterViewInit {
  isMobile = false;

  constructor(
    private userAgentService: UserAgentService,
    private platform: PlatformService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.isMobile = this.userAgentService.isMobile();
  }

  ngAfterViewInit() {
    if (this.platform.isBrowser && !this.isMobile) {
      const siderEle = this.document.getElementById('sider') as HTMLElement;
      const documentEle = this.document.documentElement;
      const scrollFn = (siderEle: HTMLElement) => {
        if (documentEle.scrollTop > 0 && documentEle.scrollTop > siderEle.scrollHeight - documentEle.clientHeight) {
          siderEle.style.position = 'sticky';
          siderEle.style.top = documentEle.clientHeight - siderEle.scrollHeight - 16 + 'px';
        } else {
          siderEle.style.position = 'relative';
          siderEle.style.top = '';
        }
      };
      window.addEventListener('scroll', () => scrollFn(siderEle));
      window.addEventListener('resize', () => scrollFn(siderEle));
    }
  }
}
