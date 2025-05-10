import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageService } from 'ng-zorro-antd/image';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from 'src/app/components/breadcrumb/breadcrumb.component';
import { CommentComponent } from 'src/app/components/comment/comment.component';
import { GameModalComponent } from 'src/app/components/game-modal/game-modal.component';
import { GamePrevNextComponent } from 'src/app/components/game-prev-next/game-prev-next.component';
import { GameRelatedComponent } from 'src/app/components/game-related/game-related.component';
import { LoginModalComponent } from 'src/app/components/login-modal/login-modal.component';
import { MakeMoneyComponent } from 'src/app/components/make-money/make-money.component';
import { ShareModalComponent } from 'src/app/components/share-modal/share-modal.component';
import { GAME_EMPTY_COVER } from 'src/app/config/common.constant';
import { Message } from 'src/app/config/message.enum';
import { ResponseCode } from 'src/app/config/response-code.enum';
import { CommentObjectType } from 'src/app/enums/comment';
import { FavoriteType } from 'src/app/enums/favorite';
import { VoteType, VoteValue } from 'src/app/enums/vote';
import { BreadcrumbEntity } from 'src/app/interfaces/breadcrumb';
import { Game, GameEntity } from 'src/app/interfaces/game';
import { OptionEntity } from 'src/app/interfaces/option';
import { TagEntity } from 'src/app/interfaces/tag';
import { TaxonomyEntity } from 'src/app/interfaces/taxonomy';
import { TenantAppModel } from 'src/app/interfaces/tenant-app';
import { NumberViewPipe } from 'src/app/pipes/number-view.pipe';
import { SafeHtmlPipe } from 'src/app/pipes/safe-html.pipe';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { CommentService } from 'src/app/services/comment.service';
import { CommonService } from 'src/app/services/common.service';
import { DestroyService } from 'src/app/services/destroy.service';
import { FavoriteService } from 'src/app/services/favorite.service';
import { GameService } from 'src/app/services/game.service';
import { MessageService } from 'src/app/services/message.service';
import { MetaService } from 'src/app/services/meta.service';
import { OptionService } from 'src/app/services/option.service';
import { PlatformService } from 'src/app/services/platform.service';
import { TenantAppService } from 'src/app/services/tenant-app.service';
import { UserAgentService } from 'src/app/services/user-agent.service';
import { UserService } from 'src/app/services/user.service';
import { VoteService } from 'src/app/services/vote.service';
import { environment } from 'src/environments/environment';

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
  readonly emptyCover = GAME_EMPTY_COVER;

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
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly userService: UserService,
    private readonly voteService: VoteService,
    private readonly favoriteService: FavoriteService,
    private readonly commentService: CommentService,
    private readonly gameService: GameService
  ) {
    this.isMobile = this.userAgentService.isMobile;
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
        this.referrer = this.commonService.getReferrer();
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
    const previewRef = this.imageService.preview([
      {
        src: '/assets/images/reward.jpg'
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
          window.open(environment.apiBase + res);
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
      url: `/game/category/${item.slug}`
    }));
    breadcrumbs.unshift({
      label: '游戏',
      tooltip: '游戏列表',
      url: '/game',
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
