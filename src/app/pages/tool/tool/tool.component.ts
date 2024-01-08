import { Component, OnInit } from '@angular/core';
import { isEmpty, uniq } from 'lodash';
import { NzImageService } from 'ng-zorro-antd/image';
import { skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { PATH_RED_PACKET } from '../../../config/common.constant';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { UserAgentService } from '../../../core/user-agent.service';
import { FavoriteLink } from '../../../interfaces/link.interface';
import { OptionEntity } from '../../../interfaces/option.interface';
import { LinkService } from '../../../services/link.service';
import { OptionService } from '../../../services/option.service';

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
    private userAgentService: UserAgentService,
    private destroy$: DestroyService,
    private metaService: MetaService,
    private commonService: CommonService,
    private breadcrumbService: BreadcrumbService,
    private optionService: OptionService,
    private imageService: NzImageService,
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
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => {
        this.options = options;
        this.updatePageInfo();
      });
    this.fetchFavoriteLinks();
  }

  showAlipayRedPacketQrcode() {
    const previewRef = this.imageService.preview([
      {
        src: PATH_RED_PACKET
      }
    ]);
    this.commonService.addPaddingToImagePreview(previewRef.previewInstance.imagePreviewWrapper);
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
    this.linkService
      .getFavoriteLinks()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.favoriteLinks = res.filter((item) => item.taxonomySlug !== 'favorite-links');
      });
  }

  private updatePageInfo() {
    const siteName: string = this.options['site_name'] || '';
    const titles: string[] = ['百宝箱', siteName];
    const description = `${siteName}${this.options['tool_description']}`;
    const keywords: string[] = (this.options['tool_keywords'] || '').split(',');

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
