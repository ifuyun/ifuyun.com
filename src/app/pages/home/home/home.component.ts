import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { isEmpty } from 'lodash';
import { combineLatestWith, skipWhile, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { ResultList } from '../../../core/common.interface';
import { CommonService } from '../../../core/common.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { PaginatorService } from '../../../core/paginator.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { OptionEntity } from '../../../interfaces/option.interface';
import { OptionService } from '../../../services/option.service';
import { Post } from '../../post/post.interface';
import { PostService } from '../../post/post.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent extends PageComponent implements OnInit, OnDestroy {
  isMobile = false;
  pageIndex = 'index';
  options: OptionEntity = {};
  keyword = '';
  postList: ResultList<Post> = {};

  private optionsListener!: Subscription;
  private postsListener!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private optionService: OptionService,
    private commonService: CommonService,
    private metaService: MetaService,
    private breadcrumbService: BreadcrumbService,
    private postService: PostService,
    private paginator: PaginatorService,
    private userAgentService: UserAgentService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updatePageOptions();
    this.updateActivePage();
    this.optionsListener = this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        combineLatestWith(this.route.queryParamMap),
        tap(([, queryParams]) => {
          this.keyword = queryParams.get('keyword')?.trim() || '';
        })
      )
      .subscribe(([options]) => {
        this.options = options;
        this.updatePageInfo();
        this.fetchPosts();
      });
  }

  ngOnDestroy() {
    this.optionsListener.unsubscribe();
    this.postsListener.unsubscribe();
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

  private fetchPosts() {
    this.postsListener = this.postService.getPosts({
      page: 1,
      sticky: 0
    }).subscribe((res) => {
      this.postList = res.postList || {};
    });
  }

  private updatePageInfo() {
    const titles = [this.options['site_slogan'], this.options['site_name']];

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description: this.options['wallpaper_description'],
      keywords: this.options['wallpaper_keywords'],
      author: this.options['site_author']
    });
  }
}
