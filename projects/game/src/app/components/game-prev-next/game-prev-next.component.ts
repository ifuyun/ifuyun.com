import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameService } from 'common/components';
import { DestroyService, GAME_EMPTY_COVER, UserAgentService } from 'common/core';
import { GameEntity } from 'common/interfaces';
import { CommonService } from 'common/services';
import { skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'app-game-prev-next',
  imports: [RouterLink],
  providers: [DestroyService],
  templateUrl: './game-prev-next.component.html'
})
export class GamePrevNextComponent implements OnInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly uaService = inject(UserAgentService);
  private readonly commonService = inject(CommonService);
  private readonly gameService = inject(GameService);

  readonly emptyCover = this.commonService.getCdnUrlPrefix() + GAME_EMPTY_COVER;
  readonly isMobile = this.uaService.isMobile;
  readonly isChanged = signal(false);
  readonly prevGame = signal<GameEntity | null>(null);
  readonly nextGame = signal<GameEntity | null>(null);

  private readonly gameId = signal('');
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
          this.getGamesOfPrevAndNext();
          this.isLoaded.set(true);
        }
      });
  }

  private getGamesOfPrevAndNext(): void {
    this.gameService
      .getGamesOfPrevAndNext(this.gameId())
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.prevGame.set(res.prevGame);
        this.nextGame.set(res.nextGame);
      });
  }
}
