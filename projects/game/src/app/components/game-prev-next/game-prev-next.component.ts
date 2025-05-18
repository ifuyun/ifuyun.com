import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameService } from 'common/components';
import { DestroyService, GAME_EMPTY_COVER, UserAgentService } from 'common/core';
import { GameEntity } from 'common/interfaces';
import { skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'app-game-prev-next',
  imports: [RouterLink],
  providers: [DestroyService],
  templateUrl: './game-prev-next.component.html'
})
export class GamePrevNextComponent implements OnInit {
  readonly emptyCover = GAME_EMPTY_COVER;

  isMobile = false;
  isChanged = false;
  prevGame?: GameEntity;
  nextGame?: GameEntity;

  private gameId = '';
  private isLoaded = false;

  constructor(
    private readonly destroy$: DestroyService,
    private readonly userAgentService: UserAgentService,
    private readonly gameService: GameService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngOnInit(): void {
    this.gameService.activeGameId$
      .pipe(
        skipWhile((gameId) => !gameId),
        takeUntil(this.destroy$)
      )
      .subscribe((gameId) => {
        this.isChanged = this.gameId !== gameId;
        this.gameId = gameId;
        if (!this.isLoaded || this.isChanged) {
          this.getGamesOfPrevAndNext();
          this.isLoaded = true;
        }
      });
  }

  private getGamesOfPrevAndNext(): void {
    this.gameService
      .getGamesOfPrevAndNext(this.gameId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.prevGame = res.prevGame;
        this.nextGame = res.nextGame;
      });
  }
}
