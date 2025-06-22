import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  BreadcrumbComponent,
  CommentComponent,
  GameModalComponent,
  GameService,
  LoginModalComponent,
  MakeMoneyComponent,
  ShareModalComponent
} from 'common/components';
import {
  AppConfigService,
  BreadcrumbEntity,
  BreadcrumbService,
  DestroyService,
  GAME_EMPTY_COVER,
  Message,
  MessageService,
  MetaService,
  OptionEntity,
  PlatformService,
  ResponseCode,
  UserAgentService
} from 'common/core';
import { CommentObjectType, FavoriteType, VoteType, VoteValue } from 'common/enums';
import { Game, GameEntity, TagEntity, TaxonomyEntity, TenantAppModel } from 'common/interfaces';
import { NumberViewPipe, SafeHtmlPipe } from 'common/pipes';
import {
  AdsService,
  AdsStatus,
  CommentService,
  CommonService,
  FavoriteService,
  OptionService,
  TenantAppService,
  UserService,
  VoteService
} from 'common/services';
import { isEmpty, uniq } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageService } from 'ng-zorro-antd/image';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { GamePrevNextComponent } from '../../components/game-prev-next/game-prev-next.component';
import { GameRelatedComponent } from '../../components/game-related/game-related.component';

@Component({
  selector: 'app-game',
  imports: [
    NgIf,
    NgFor,
    RouterLink,
    DatePipe,
    NzIconModule,
    SafeHtmlPipe,
    NumberViewPipe,
    NzButtonModule,
    BreadcrumbComponent,
    GamePrevNextComponent,
    GameRelatedComponent,
    GameModalComponent,
    CommentComponent,
    ShareModalComponent,
    LoginModalComponent,
    MakeMoneyComponent
  ],
  providers: [DestroyService, NzImageService],
  templateUrl: './game.component.html',
  styleUrl: './game.component.less'
})
export class GameComponent implements OnInit {
  readonly commentType = CommentObjectType.GAME;
  readonly emptyCover: string = '';

  isMobile = false;
  isSignIn = false;
  game!: GameEntity;
  gameCategories: TaxonomyEntity[] = [];
  gameTags: TagEntity[] = [];
  isFavorite = false;
  isVoted = false;
  voteLoading = false;
  favoriteLoading = false;
  shareVisible = false;
  shareUrl = '';
  loginVisible = false;
  gameModalVisible = false;
  downloading = false;

  protected pageIndex = 'game-detail';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private gameId = '';
  private referrer = '';
  private adsStatus: AdsStatus = AdsStatus.UNKNOWN;

  constructor(
    private readonly destroy$: DestroyService,
    private readonly route: ActivatedRoute,
    private readonly platform: PlatformService,
    private readonly userAgentService: UserAgentService,
    private readonly message: MessageService,
    private readonly imageService: NzImageService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly appConfigService: AppConfigService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly userService: UserService,
    private readonly voteService: VoteService,
    private readonly favoriteService: FavoriteService,
    private readonly commentService: CommentService,
    private readonly gameService: GameService,
    private readonly adsService: AdsService
  ) {
    this.isMobile = this.userAgentService.isMobile;
    this.emptyCover = this.commonService.getCdnUrlPrefix() + GAME_EMPTY_COVER;
  }

  ngOnInit(): void {
    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$, this.route.paramMap])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options, p]) => {
        this.appInfo = appInfo;
        this.options = options;
        this.referrer = this.commonService.getReferrer(true);
        this.gameId = p.get('gid')?.trim() || '';

        if (!this.gameId) {
          this.commonService.redirectToNotFound();
          return;
        }

        this.closeGameModal();
        this.closeLoginModal();
        this.closeShareQrcode();

        this.getGame();
        this.commentService.updateObjectId(this.gameId);
        this.gameService.updateActiveGameId(this.gameId);
      });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.isSignIn = !!user.userId;

      if (this.platform.isBrowser) {
        this.shareUrl = this.commonService.getShareURL(user.userId);
      }
    });
    this.adsService.adsStatus$.pipe(takeUntil(this.destroy$)).subscribe((status) => {
      this.adsStatus = status;
    });
  }

  onGameClick(e: MouseEvent) {
    const $target = e.target as HTMLElement;

    if ($target instanceof HTMLImageElement) {
      e.preventDefault();
      e.stopPropagation();

      this.imageService.preview([
        {
          src: $target.src
        }
      ]);
    }
  }

  vote() {
    if (this.voteLoading || this.isVoted) {
      return;
    }
    if (!this.isSignIn) {
      this.showLoginModal();
      return;
    }
    this.voteService
      .saveVote({
        objectId: this.game.gameId,
        value: VoteValue.LIKE,
        type: VoteType.GAME
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.voteLoading = false;

        if (res.code === ResponseCode.SUCCESS) {
          this.message.success(Message.VOTE_SUCCESS);
          this.isVoted = true;
          this.game.gameLikes = res.data.likes;
        }
      });
  }

  showReward() {
    const urlPrefix = this.commonService.getCdnUrlPrefix();
    const previewRef = this.imageService.preview([
      {
        src: urlPrefix + '/assets/images/reward.jpg'
      }
    ]);
    this.commonService.paddingPreview(previewRef.previewInstance.imagePreviewWrapper);
  }

  addFavorite() {
    if (this.favoriteLoading || this.isFavorite) {
      return;
    }
    if (!this.isSignIn) {
      this.showLoginModal();
      return;
    }
    this.favoriteLoading = true;
    this.favoriteService
      .addFavorite(this.gameId, FavoriteType.GAME)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.favoriteLoading = false;

        if (res.code === ResponseCode.SUCCESS || res.code === ResponseCode.FAVORITE_IS_EXIST) {
          this.message.success(Message.ADD_FAVORITE_SUCCESS);
          this.isFavorite = true;
        }
      });
  }

  showShareQrcode() {
    this.shareVisible = true;
  }

  closeShareQrcode() {
    this.shareVisible = false;
  }

  startPlay() {
    if (!this.isSignIn && this.adsStatus === AdsStatus.BLOCKED) {
      this.showLoginModal();
      return;
    }
    if (this.gameService.isGameCached(this.gameId)) {
      this.showGameModal();
      return;
    }
    this.gameService
      .checkPlay()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.code === ResponseCode.SUCCESS) {
          this.showGameModal();
        } else {
          this.showLoginModal();
        }
      });
  }

  download() {
    if (!this.isSignIn) {
      this.showLoginModal();
      return;
    }
    this.downloading = true;
    this.gameService
      .getGameDownloadUrl(this.gameId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.downloading = false;
        if (res) {
          window.open(this.appConfigService.apiBase + res);
        }
      });
  }

  showLoginModal() {
    this.loginVisible = true;
  }

  closeLoginModal() {
    this.loginVisible = false;
  }

  showGameModal() {
    this.gameModalVisible = true;
  }

  closeGameModal() {
    this.gameModalVisible = false;
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getGame() {
    this.gameService
      .getGameById(this.gameId, this.referrer)
      .pipe(takeUntil(this.destroy$))
      .subscribe((game) => {
        if (!game) {
          this.commonService.redirectToNotFound();
          return;
        }
        this.initData(game);
      });
  }

  private initData(game: Game) {
    this.game = game.game;
    this.gameCategories = game.categories;
    this.gameTags = game.tags;
    this.isFavorite = game.isFavorite;
    this.isVoted = game.isVoted;

    this.updateBreadcrumbs(game.breadcrumbs);
    this.updatePageIndex();
    this.updatePageInfo();
  }

  private updateBreadcrumbs(breadcrumbData?: BreadcrumbEntity[]) {
    const breadcrumbs = (breadcrumbData || []).map((item) => ({
      ...item,
      url: `/category/${item.slug}`,
      domain: 'game'
    }));
    breadcrumbs.unshift({
      label: '游戏',
      tooltip: '游戏',
      url: '/',
      domain: 'game',
      isHeader: false
    });

    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }

  private updatePageInfo() {
    const titles: string[] = [this.game.gameTitle, '游戏', this.appInfo.appName];
    const keywords: string[] = this.gameTags
      .map((item) => item.tagName)
      .concat((this.options['game_keywords'] || '').split(','));
    const description = `「${this.game.gameTitle}」在线玩。${this.options['game_description']}`;

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description: this.game.gameExcerpt || description,
      keywords: uniq(keywords)
        .filter((item) => !!item)
        .join(','),
      author: this.options['site_author']
    });
  }
}
