import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { BaseComponent } from '../../core/base.component';
import { CrumbEntity } from '../../interfaces/crumb';
import { PostArchiveDateMap } from '../../interfaces/posts';
import { CrumbService } from '../../services/crumb.service';
import { PostsService } from '../../services/posts.service';

@Component({
  selector: 'app-archive',
  templateUrl: './archive.component.html',
  styleUrls: ['./archive.component.less']
})
export class ArchiveComponent extends BaseComponent implements OnInit, OnDestroy {
  pageIndex: string = 'archive';
  archiveDateList!: PostArchiveDateMap;
  archiveYearList: string[] = [];
  showCrumb: boolean = true;

  private archiveListener!: Subscription;

  constructor(
    private postsService: PostsService,
    private crumbService: CrumbService
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
    });
  }

  ngOnDestroy() {
    this.archiveListener.unsubscribe();
  }
}
