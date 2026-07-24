import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameService } from 'common/components';
import { DestroyService, GAME_EMPTY_COVER, UserAgentService } from 'common/core';
import { GameSearchItem } from 'common/interfaces';
import { CommonService } from 'common/services';
import { skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'app-game-related',
  imports: [RouterLink],
  providers: [DestroyService],
  templateUrl: './game-related.component.html'
})
export class GameRelatedComponent implements OnInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly uaService = inject(UserAgentService);
  private readonly commonService = inject(CommonService);
  private readonly gameService = inject(GameService);

  readonly emptyCover = this.commonService.getCdnUrlPrefix() + GAME_EMPTY_COVER;
  readonly isMobile = this.uaService.isMobile;
  readonly relatedGames = signal<GameSearchItem[]>([]);

  private readonly gameId = signal('');
  private readonly isChanged = signal(false);
  private readonly isLoaded = signal(false);

  ngOnInit(): void {
    this.gameService.activeGameId$
      .pipe(
        skipWhile((gameId) => !gameId),
        takeUntil(this.destroy$)
      )
      .subscribe((gameId) => {
        this.isChanged.set(this.gameId() !== gameId);
        this.gameId.set(gameId);
        if (!this.isLoaded() || this.isChanged()) {
          this.getRelatedGames();
          this.isLoaded.set(true);
        }
      });
  }

  private getRelatedGames(): void {
    this.gameService
      .getRelatedGames({
        id: this.gameId(),
        page: 1,
        size: 4
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.relatedGames.set(res);
      });
  }
}
