import { NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  BreadcrumbComponent,
  GameItemComponent,
  GameService,
  MakeMoneyComponent,
  PaginationComponent
} from 'common/components';
import {
  BreadcrumbEntity,
  BreadcrumbService,
  DestroyService,
  MetaService,
  OptionEntity,
  PaginationService,
  UserAgentService
} from 'common/core';
import { ListMode } from 'common/enums';
import { Game, GameQueryParam, TenantAppModel } from 'common/interfaces';
import { CommonService, OptionService, TenantAppService } from 'common/services';
import { isEmpty, uniq } from 'lodash';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'app-game-list',
  imports: [NgFor, NzEmptyModule, BreadcrumbComponent, PaginationComponent, MakeMoneyComponent, GameItemComponent],
  providers: [DestroyService],
  templateUrl: './game-list.component.html',
  styleUrl: './game-list.component.less'
})
export class GameListComponent implements OnInit {
  isMobile = false;
  page = 1;
  pageSize = 10;
  total = 0;
  games: Game[] = [];

  protected readonly ListMode = ListMode;

  protected pageIndex = 'game-list';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private lastParam = '';
  private category = '';
  private tag = '';

  get paginationUrl() {
    if (this.category) {
      return `/category/${this.category}`;
    }
    if (this.tag) {
      return `/tag/${this.tag}`;
    }

    return '/list';
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly destroy$: DestroyService,
    private readonly userAgentService: UserAgentService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly paginationService: PaginationService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly gameService: GameService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngOnInit(): void {
    combineLatest([
      this.tenantAppService.appInfo$,
      this.optionService.options$,
      this.route.paramMap,
      this.route.queryParamMap
    ])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        const { queryParamMap: qp, paramMap: p } = this.route.snapshot;

        this.appInfo = appInfo;
        this.options = options;

        this.pageSize = Number(this.options['game_page_size']) || 10;
        this.page = Number(qp.get('page')) || 1;

        this.category = p.get('category')?.trim() || '';
        this.tag = p.get('tag')?.trim() || '';

        const latestParam = JSON.stringify({
          page: this.page,
          category: this.category,
          tag: this.tag
        });
        if (latestParam === this.lastParam) {
          return;
        }
        this.lastParam = latestParam;

        this.updatePageIndex();
        this.getGames();
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getGames() {
    const param: GameQueryParam = {
      page: this.page,
      pageSize: this.pageSize
    };
    if (this.category) {
      param.category = this.category;
    }
    if (this.tag) {
      param.tag = this.tag;
    }

    this.gameService
      .getGames(param)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.games = res.games?.list || [];
        this.page = res.games?.page || 1;
        this.total = res.games?.total || 0;

        const breadcrumbs = (res.breadcrumbs || []).map((item) => ({
          ...item,
          url: `/game/category/${item.slug}`
        }));
        this.paginationService.updatePagination({
          page: this.page,
          total: this.total,
          pageSize: this.pageSize,
          url: this.paginationUrl
        });
        this.updatePageInfo(breadcrumbs);
        this.updateBreadcrumbs(breadcrumbs);
      });
  }

  private updatePageInfo(breadcrumbData: BreadcrumbEntity[]) {
    const titles: string[] = ['游戏', this.appInfo.appName];
    const categories: string[] = [];
    const keywords: string[] = (this.options['game_keywords'] || '').split(',');
    let description = '';

    if (this.category && breadcrumbData.length > 0) {
      const label = breadcrumbData[breadcrumbData.length - 1].label;
      titles.unshift(label);
      categories.push(label);
      keywords.unshift(label);
    }
    if (this.tag) {
      titles.unshift(this.tag);
      categories.push(this.tag);
      keywords.unshift(this.tag);
    }
    description += categories.length > 0 ? `「${categories.join('-')}」` : '';
    if (description) {
      description += '游戏列表';
    }
    if (this.page > 1) {
      titles.unshift(`第${this.page}页`);
      if (description) {
        description += `(第${this.page}页)`;
      }
    }
    if (description) {
      description += '。';
    }
    description += this.options['game_description'];

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description,
      keywords: uniq(keywords)
        .filter((item) => !!item)
        .join(','),
      author: this.options['site_author']
    });
  }

  private updateBreadcrumbs(breadcrumbData: BreadcrumbEntity[]) {
    let breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '游戏',
        tooltip: `游戏`,
        url: '/',
        domain: 'game',
        isHeader: false
      }
    ];
    if (this.tag) {
      breadcrumbs.push(
        {
          label: '标签',
          tooltip: '标签',
          url: '',
          isHeader: false
        },
        {
          label: this.tag,
          tooltip: this.tag,
          url: `/tag/${this.tag}`,
          domain: 'game',
          isHeader: true
        }
      );
    }
    if (breadcrumbData.length > 0) {
      breadcrumbs = breadcrumbs.concat(breadcrumbData);
    }
    if (this.page > 1) {
      breadcrumbs.push({
        label: `第${this.page}页`,
        tooltip: `第${this.page}页`,
        url: '',
        isHeader: false
      });
    }

    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
