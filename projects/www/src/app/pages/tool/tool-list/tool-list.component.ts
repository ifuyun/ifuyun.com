import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbComponent, MakeMoneyComponent } from 'common/components';
import {
  BreadcrumbEntity,
  BreadcrumbService,
  DestroyService,
  HTMLMetaData,
  MetaService,
  OptionEntity,
  UserAgentService
} from 'common/core';
import { LogActionType, LogTargetType } from 'common/enums';
import { FavoriteLink, TenantAppVo } from 'common/interfaces';
import { CommonService, LinkService, LogService, OptionService, TenantAppService } from 'common/services';
import { isEmpty } from 'lodash';
import { NzImageService } from 'ng-zorro-antd/image';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'app-tool-list',
  imports: [RouterLink, BreadcrumbComponent, MakeMoneyComponent],
  providers: [DestroyService, NzImageService],
  templateUrl: './tool-list.component.html',
  styleUrls: ['../tool.less', './tool-list.component.less']
})
export class ToolListComponent implements OnInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly uaService = inject(UserAgentService);
  private readonly commonService = inject(CommonService);
  private readonly metaService = inject(MetaService);
  private readonly imageService = inject(NzImageService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);
  private readonly linkService = inject(LinkService);
  private readonly logService = inject(LogService);

  readonly isMobile = this.uaService.isMobile;
  readonly favoriteLinks = signal<FavoriteLink[]>([]);

  protected readonly pageIndex = 'tool';

  private readonly appInfo = signal<TenantAppVo | null>(null);
  private readonly options = signal<OptionEntity>({});

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
        this.appInfo.set(appInfo);
        this.options.set(options);

        this.updatePageInfo();
      });
  }

  showRedPacket() {
    const urlPrefix = this.commonService.getCdnUrlPrefix();
    const previewRef = this.imageService.preview([
      {
        src: urlPrefix + '/assets/images/red-packet.png'
      }
    ]);
    this.commonService.paddingPreview(previewRef.previewInstance.imagePreviewWrapper);

    this.logService
      .logAction({
        action: LogActionType.SHOW_RED_PACKET,
        targetType: LogTargetType.TOOL_LIST
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
        this.favoriteLinks.set(res || []);
      });
  }

  private updatePageInfo() {
    const titles = ['工具', this.appInfo()!.name];
    const description = this.options()['tool_description'];
    const metaData: HTMLMetaData = {
      title: titles.join(' - '),
      description,
      keywords: this.options()['tool_keywords'],
      author: this.options()['site_author']
    };
    this.metaService.updateHTMLMeta(metaData);
  }

  private updateBreadcrumbs(): void {
    const breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '工具',
        tooltip: '工具',
        url: '/tool',
        domain: 'www',
        isHeader: true
      }
    ];
    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
