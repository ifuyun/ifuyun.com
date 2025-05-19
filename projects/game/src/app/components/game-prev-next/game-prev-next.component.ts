import { Component, OnInit } from '@angular/core';
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
  readonly emptyCover: string = '';

  isMobile = false;
  isChanged = false;
  prevGame?: GameEntity;
  nextGame?: GameEntity;

  private gameId = '';
  private isLoaded = false;

  constructor(
    private readonly destroy$: DestroyService,
    private readonly userAgentService: UserAgentService,
    private readonly commonService: CommonService,
    private readonly gameService: GameService
  ) {
    this.isMobile = this.userAgentService.isMobile;
    this.emptyCover = this.commonService.getCdnUrlPrefix() + GAME_EMPTY_COVER;
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
