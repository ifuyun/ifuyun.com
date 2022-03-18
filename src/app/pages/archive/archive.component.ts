import { Component, OnDestroy, OnInit } from '@angular/core';
import { uniq } from 'lodash';
import { Subscription } from 'rxjs';
import { CrumbEntity } from '../../components/crumb/crumb.interface';
import { CrumbService } from '../../components/crumb/crumb.service';
import { BasePageComponent } from '../../core/base-page.component';
import { CommonService } from '../../core/common.service';
import { HTMLMetaData } from '../../interfaces/meta';
import { OptionEntity } from '../../interfaces/options';
import { PostArchiveDateMap } from '../../interfaces/posts';
import { CustomMetaService } from '../../services/custom-meta.service';
import { OptionsService } from '../../services/options.service';
import { PostsService } from '../../services/posts.service';

@Component({
  selector: 'app-archive',
  templateUrl: './archive.component.html',
  styleUrls: ['./archive.component.less']
})
export class ArchiveComponent extends BasePageComponent implements OnInit, OnDestroy {
  pageIndex: string = 'archive';
  archiveDateList!: PostArchiveDateMap;
  archiveYearList: string[] = [];
  showCrumb: boolean = true;

  private options: OptionEntity = {};
  private optionsListener!: Subscription;
  private archiveListener!: Subscription;

  constructor(
    private optionsService: OptionsService,
    private metaService: CustomMetaService,
    private postsService: PostsService,
    private crumbService: CrumbService,
    private commonService: CommonService
  ) {
    super();
  }

  ngOnInit(): void {
    this.optionsListener = this.optionsService.options$.subscribe((options) => {
      this.options = options;
      const titles = ['文章归档', this.options['site_name']];
      const keywords: string[] = (this.options['site_keywords'] || '').split(',');
      const metaData: HTMLMetaData = {
        title: titles.join(' - '),
        description: `${this.options['site_name']}文章归档。${this.options['site_description']}`,
        author: this.options['site_author'],
        keywords: uniq(keywords).join(',')
      };
      this.metaService.updateHTMLMeta(metaData);
    });
    const crumbs: CrumbEntity[] = [{
      'label': '文章归档',
      'tooltip': '文章归档',
      'url': '/archive',
      'headerFlag': false
    }, {
      'label': '归档历史',
      'tooltip': '归档历史',
      'url': '',
      'headerFlag': true
    }];
    this.crumbService.updateCrumb(crumbs);
    this.archiveListener = this.postsService.getPostArchiveDates({
      showCount: true,
      limit: 0
    }).subscribe((res) => {
      const { dateList, yearList } = this.postsService.transformArchiveDates(res);
      this.archiveDateList = dateList;
      this.archiveYearList = yearList;
      this.updateActivePage();
    });
  }

  ngOnDestroy() {
    this.optionsListener.unsubscribe();
    this.archiveListener.unsubscribe();
  }

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.pageIndex);
  }
}
