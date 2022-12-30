import { Component, OnDestroy, OnInit } from '@angular/core';
import { isEmpty, uniq } from 'lodash';
import { skipWhile, Subscription } from 'rxjs';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { ArchiveDataMap } from '../../../core/common.interface';
import { CommonService } from '../../../core/common.service';
import { HTMLMetaData } from '../../../core/meta.interface';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { UserAgentService } from '../../../core/user-agent.service';
import { OptionEntity } from '../../../interfaces/option.interface';
import { OptionService } from '../../../services/option.service';
import { WallpaperService } from '../wallpaper.service';

@Component({
  selector: 'app-wallpaper-archive',
  templateUrl: './wallpaper-archive.component.html',
  styleUrls: []
})
export class WallpaperArchiveComponent extends PageComponent implements OnInit, OnDestroy {
  isMobile = false;
  pageIndex = 'wallpaperArchive';
  archiveDateList!: ArchiveDataMap;
  archiveYearList: string[] = [];

  private options: OptionEntity = {};
  private breadcrumbs: BreadcrumbEntity[] = [];

  private optionsListener!: Subscription;
  private archivesListener!: Subscription;

  constructor(
    private optionService: OptionService,
    private metaService: MetaService,
    private commonService: CommonService,
    private userAgentService: UserAgentService,
    private breadcrumbService: BreadcrumbService,
    private wallpaperService: WallpaperService
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
    this.fetchArchiveData();
  }

  ngOnDestroy() {
    this.optionsListener.unsubscribe();
    this.archivesListener.unsubscribe();
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

  private fetchArchiveData() {
    this.archivesListener = this.wallpaperService
      .getWallpaperArchives({
        showCount: true,
        limit: 0
      })
      .subscribe((res) => {
        const { dateList, yearList } = this.wallpaperService.transformArchives(res);
        this.archiveDateList = dateList;
        this.archiveYearList = yearList;
      });
  }

  private updatePageInfo() {
    const titles = ['归档', '壁纸', this.options['site_name']];
    const keywords: string[] = (this.options['site_keywords'] || '').split(',');
    const metaData: HTMLMetaData = {
      title: titles.join(' - '),
      description: `${this.options['site_name']}壁纸归档。${this.options['site_description']}`,
      author: this.options['site_author'],
      keywords: uniq(keywords).join(',')
    };
    this.metaService.updateHTMLMeta(metaData);
  }

  private updateBreadcrumb(): void {
    this.breadcrumbs = [
      {
        label: `壁纸`,
        tooltip: `高清壁纸`,
        url: '/wallpaper',
        isHeader: false
      },
      {
        label: '归档',
        tooltip: '壁纸归档',
        url: '/wallpaper/archive',
        isHeader: true
      }
    ];
    this.breadcrumbService.updateCrumb(this.breadcrumbs);
  }
}
