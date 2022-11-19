import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import * as QRCode from 'qrcode';
import { skipWhile, Subscription } from 'rxjs';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { ImageService } from '../../../components/image/image.service';
import { MessageService } from '../../../components/message/message.service';
import { CommonService } from '../../../core/common.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { UserAgentService } from '../../../core/user-agent.service';
import { OptionEntity } from '../../../interfaces/option.interface';
import { OptionService } from '../../../services/option.service';
import { TOOL_PAGE_DESCRIPTION, TOOL_PAGE_KEYWORDS } from '../tool.constant';

@Component({
  selector: 'app-tool',
  templateUrl: './tool.component.html',
  styleUrls: ['./tool.component.less']
})
export class ToolComponent extends PageComponent implements OnInit, OnDestroy {
  isMobile = false;
  options: OptionEntity = {};

  protected pageIndex = 'tool';

  private breadcrumbs: BreadcrumbEntity[] = [];

  private optionsListener!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private optionService: OptionService,
    private commonService: CommonService,
    private breadcrumbService: BreadcrumbService,
    private metaService: MetaService,
    private userAgentService: UserAgentService,
    private imageService: ImageService,
    private message: MessageService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updateActivePage();
    this.updatePageOptions();
    this.updateBreadcrumb();
    this.optionsListener = this.optionService.options$
      .pipe(skipWhile((options) => isEmpty(options)))
      .subscribe((options) => {
        this.options = options;
        this.updatePageInfo();
      });
  }

  ngOnDestroy(): void {
    this.optionsListener.unsubscribe();
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
    this.breadcrumbService.updateCrumb(this.breadcrumbs);
  }
}
