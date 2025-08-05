import { Component, OnInit } from '@angular/core';
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
  readonly emptyCover: string = '';

  isMobile = false;
  relatedGames: GameSearchItem[] = [];

  private gameId = '';
  private isChanged = false;
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
          this.getRelatedGames();
          this.isLoaded = true;
        }
      });
  }

  private getRelatedGames(): void {
    this.gameService
      .getRelatedGames({
        gameId: this.gameId,
        page: 1,
        size: 4
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.relatedGames = res;
      });
  }
}
