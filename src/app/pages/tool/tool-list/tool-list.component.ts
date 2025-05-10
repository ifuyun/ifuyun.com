import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { NzImageService } from 'ng-zorro-antd/image';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from 'src/app/components/breadcrumb/breadcrumb.component';
import { MakeMoneyComponent } from 'src/app/components/make-money/make-money.component';
import { ActionObjectType, ActionType } from 'src/app/enums/log';
import { FavoriteLink } from 'src/app/interfaces/link';
import { HTMLMetaData } from 'src/app/interfaces/meta';
import { OptionEntity } from 'src/app/interfaces/option';
import { TenantAppModel } from 'src/app/interfaces/tenant-app';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { CommonService } from 'src/app/services/common.service';
import { DestroyService } from 'src/app/services/destroy.service';
import { LinkService } from 'src/app/services/link.service';
import { LogService } from 'src/app/services/log.service';
import { MetaService } from 'src/app/services/meta.service';
import { OptionService } from 'src/app/services/option.service';
import { TenantAppService } from 'src/app/services/tenant-app.service';
import { UserAgentService } from 'src/app/services/user-agent.service';

@Component({
  selector: 'app-tool-list',
  imports: [RouterLink, BreadcrumbComponent, MakeMoneyComponent],
  providers: [DestroyService, NzImageService],
  templateUrl: './tool-list.component.html',
  styleUrls: ['../tool.less', './tool-list.component.less']
})
export class ToolListComponent implements OnInit {
  isMobile = false;
  favoriteLinks: FavoriteLink[] = [];

  protected pageIndex = 'tool';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};

  constructor(
    private readonly destroy$: DestroyService,
    private readonly userAgentService: UserAgentService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly imageService: NzImageService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly linkService: LinkService,
    private readonly logService: LogService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngOnInit(): void {
    this.updatePageIndex();
    this.updateBreadcrumbs();
    this.getFavoriteLinks();

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        this.appInfo = appInfo;
        this.options = options;

        this.updatePageInfo();
      });
  }

  showRedPacket() {
    const previewRef = this.imageService.preview([
      {
        src: '/assets/images/red-packet.png'
      }
    ]);
    this.commonService.paddingPreview(previewRef.previewInstance.imagePreviewWrapper);

    this.logService
      .logAction({
        action: ActionType.SHOW_RED_PACKET,
        objectType: ActionObjectType.TOOL_LIST
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getFavoriteLinks() {
    this.linkService
      .getFavoriteLinks()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.favoriteLinks = res || [];
      });
  }

  private updatePageInfo() {
    const titles = ['工具', this.appInfo.appName];
    const description = `${this.appInfo.appName}${this.options['tool_description']}`;
    const metaData: HTMLMetaData = {
      title: titles.join(' - '),
      description,
      keywords: this.options['tool_keywords'],
      author: this.options['site_author']
    };
    this.metaService.updateHTMLMeta(metaData);
  }

  private updateBreadcrumbs(): void {
    const breadcrumbs = [
      {
        label: '工具',
        tooltip: '工具',
        url: '/tool',
        isHeader: true
      }
    ];
    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
