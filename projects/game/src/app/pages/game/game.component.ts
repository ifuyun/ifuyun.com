import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  BreadcrumbComponent,
  CommentComponent,
  GameModalComponent,
  GameService,
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
import { CommentTargetType, FavoriteType, VoteType, VoteValue } from 'common/enums';
import { IconCalendarDateComponent, IconShareFillComponent } from 'common/icons';
import { Game, TenantAppVo } from 'common/interfaces';
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
    MakeMoneyComponent,
    IconCalendarDateComponent,
    IconShareFillComponent
  ],
  providers: [DestroyService, NzImageService],
  templateUrl: './game.component.html',
  styleUrl: './game.component.less'
})
export class GameComponent implements OnInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly route = inject(ActivatedRoute);
  private readonly platform = inject(PlatformService);
  private readonly uaService = inject(UserAgentService);
  private readonly message = inject(MessageService);
  private readonly imageService = inject(NzImageService);
  private readonly commonService = inject(CommonService);
  private readonly metaService = inject(MetaService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly appConfigService = inject(AppConfigService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);
  private readonly userService = inject(UserService);
  private readonly voteService = inject(VoteService);
  private readonly favoriteService = inject(FavoriteService);
  private readonly commentService = inject(CommentService);
  private readonly gameService = inject(GameService);
  private readonly adsService = inject(AdsService);

  readonly commentType = CommentTargetType.GAME;
  readonly emptyCover = this.commonService.getCdnUrlPrefix() + GAME_EMPTY_COVER;

  isMobile = this.uaService.isMobile;
  isSignIn = signal(false);
  game = signal<Game | null>(null);
  isFavorite = signal(false);
  isVoted = signal(false);
  voteLoading = signal(false);
  favoriteLoading = signal(false);
  shareVisible = signal(false);
  shareUrl = signal('');
  gameModalVisible = signal(false);
  downloading = signal(false);

  protected pageIndex = 'game-detail';

  private appInfo = signal<TenantAppVo | null>(null);
  private options = signal<OptionEntity>({});
  private gameId = signal('');
  private referrer = signal('');
  private adsStatus = signal(AdsStatus.UNKNOWN);

  ngOnInit(): void {
    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$, this.route.paramMap])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options, p]) => {
        this.appInfo.set(appInfo);
        this.options.set(options);
        this.referrer.set(this.commonService.getReferrer(true));
        this.gameId.set(p.get('gid')?.trim() || '');

        if (!this.gameId()) {
          this.commonService.redirectToNotFound();
          return;
        }

        this.closeGameModal();
        this.closeShareQrcode();

        this.getGame();
        this.commentService.updateTargetId(this.gameId());
        this.gameService.updateActiveGameId(this.gameId());
      });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.isSignIn.set(!!user.id);

      if (this.platform.isBrowser) {
        this.shareUrl.set(this.commonService.getShareURL(user.id));
      }
    });
    this.adsService.adsStatus$.pipe(takeUntil(this.destroy$)).subscribe((status) => {
      this.adsStatus.set(status);
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
    if (this.voteLoading() || this.isVoted()) {
      return;
    }
    if (!this.isSignIn()) {
      this.showSigninModal();
      return;
    }
    this.voteService
      .saveVote({
        targetId: this.game()!.id,
        value: VoteValue.LIKE,
        type: VoteType.GAME
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.voteLoading.set(false);

        if (res.code === ResponseCode.SUCCESS) {
          this.message.success(Message.VOTE_SUCCESS);
          this.isVoted.set(true);
          this.game.update((data) => ({
            ...data!,
            gameStat: {
              ...data!.gameStat,
              likeCount: res.data.likeCount
            }
          }));
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
    if (this.favoriteLoading() || this.isFavorite()) {
      return;
    }
    if (!this.isSignIn()) {
      this.showSigninModal();
      return;
    }
    this.favoriteLoading.set(true);
    this.favoriteService
      .addFavorite(this.gameId(), FavoriteType.GAME)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.favoriteLoading.set(false);

        if (res.code === ResponseCode.SUCCESS || res.code === ResponseCode.FAVORITE_IS_EXIST) {
          this.message.success(Message.ADD_FAVORITE_SUCCESS);
          this.isFavorite.set(true);
        }
      });
  }

  showShareQrcode() {
    this.shareVisible.set(true);
  }

  closeShareQrcode() {
    this.shareVisible.set(false);
  }

  startPlay() {
    if (!this.isSignIn() && this.adsStatus() === AdsStatus.BLOCKED) {
      this.showSigninModal();
      return;
    }
    if (this.gameService.isGameCached(this.gameId())) {
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
          this.showSigninModal();
        }
      });
  }

  download() {
    if (!this.isSignIn()) {
      this.showSigninModal();
      return;
    }
    this.downloading.set(true);

    this.gameService
      .getGameDownloadUrl(this.gameId())
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.downloading.set(false);
        if (res) {
          window.open(this.appConfigService.apiBase + res);
        }
      });
  }

  showSigninModal() {
    this.commonService.updateSigninOptions({
      visible: true,
      closable: true
    });
  }

  showGameModal() {
    this.gameModalVisible.set(true);
  }

  closeGameModal() {
    this.gameModalVisible.set(false);
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getGame() {
    this.gameService
      .getGameById(this.gameId(), this.referrer())
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
    this.game.set(game);
    this.isFavorite.set(game.isFavorite);
    this.isVoted.set(game.isVoted);

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
    const game = this.game();
    const titles: string[] = [game!.title, '游戏', this.appInfo()!.name];
    const keywords: string[] = game!.tags
      .map((item) => item.tag.name)
      .concat((this.options()['game_keywords'] || '').split(','));
    const description = `「${game!.title}」在线玩。${this.options()['game_description']}`;

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description: game!.summary || description,
      keywords: uniq(keywords)
        .filter((item) => !!item)
        .join(','),
      author: this.options()['site_author']
    });
  }
}
