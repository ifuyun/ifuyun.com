import { Component, Inject, OnDestroy, OnInit, Optional, PLATFORM_ID } from '@angular/core';
import { RESPONSE } from '@nguniversal/express-engine/tokens';
import { Response } from 'express';
import { Subscription } from 'rxjs';
import { BasePageComponent } from '../../core/base-page.component';
import { CrumbEntity } from '../../components/crumb/crumb.interface';
import { PostArchiveDateMap } from '../../interfaces/posts';
import { CrumbService } from '../../components/crumb/crumb.service';
import { CommonService } from '../../core/common.service';
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

  private archiveListener!: Subscription;

  constructor(
    @Inject(PLATFORM_ID) protected platform: Object,
    @Optional() @Inject(RESPONSE) protected response: Response,
    private postsService: PostsService,
    private crumbService: CrumbService,
    private commonService: CommonService
  ) {
    super();
  }

  ngOnInit(): void {
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
    this.archiveListener.unsubscribe();
  }

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.pageIndex);
  }
}
