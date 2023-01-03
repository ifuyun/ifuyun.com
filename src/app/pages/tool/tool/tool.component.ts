import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import * as QRCode from 'qrcode';
import { skipWhile } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { ImageService } from '../../../components/image/image.service';
import { MessageService } from '../../../components/message/message.service';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { UserAgentService } from '../../../core/user-agent.service';
import { FavoriteLink } from '../../../interfaces/link.interface';
import { OptionEntity } from '../../../interfaces/option.interface';
import { LinkService } from '../../../services/link.service';
import { OptionService } from '../../../services/option.service';
import { TOOL_PAGE_DESCRIPTION, TOOL_PAGE_KEYWORDS } from '../tool.constant';

@Component({
  selector: 'app-tool',
  templateUrl: './tool.component.html',
  styleUrls: ['./tool.component.less'],
  providers: [DestroyService]
})
export class ToolComponent extends PageComponent implements OnInit {
  isMobile = false;
  options: OptionEntity = {};
  favoriteLinks: FavoriteLink[] = [];

  protected pageIndex = 'tool';

  private breadcrumbs: BreadcrumbEntity[] = [];

  constructor(
    private route: ActivatedRoute,
    private userAgentService: UserAgentService,
    private destroy$: DestroyService,
    private metaService: MetaService,
    private commonService: CommonService,
    private breadcrumbService: BreadcrumbService,
    private optionService: OptionService,
    private imageService: ImageService,
    private message: MessageService,
    private linkService: LinkService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updateActivePage();
    this.updatePageOptions();
    this.updateBreadcrumb();
    this.optionService.options$
      .pipe(
        takeUntil(this.destroy$),
        skipWhile((options) => isEmpty(options))
      )
      .subscribe((options) => {
        this.options = options;
        this.updatePageInfo();
      });
    this.fetchFavoriteLinks();
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

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.pageIndex);
  }

  protected updatePageOptions(): void {
    this.commonService.updatePageOptions({
      showHeader: true,
      showFooter: true,
      showMobileHeader: true,
      showMobileFooter: true
    });
  }

  private fetchFavoriteLinks() {
    this.linkService.getFavoriteLinks()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.favoriteLinks = res.filter((item) => item.taxonomySlug !== 'favorite-links');
      });
  }

  private updatePageInfo() {
    const siteName: string = this.options['site_name'] || '';
    const titles: string[] = ['百宝箱', siteName];
    const description = `${siteName}${TOOL_PAGE_DESCRIPTION}`;
    const keywords: string[] = (this.options['site_keywords'] || '').split(',');
    keywords.unshift(...TOOL_PAGE_KEYWORDS);

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description,
      keywords: uniq(keywords).join(','),
      author: this.options['site_author']
    });
  }

  private updateBreadcrumb(): void {
    this.breadcrumbs = [
      {
        label: '百宝箱',
        tooltip: '实用工具',
        url: '/tool',
        isHeader: true
      }
    ];
    this.breadcrumbService.updateBreadcrumb(this.breadcrumbs);
  }
}
