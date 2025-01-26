import { NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { skipWhile, takeUntil } from 'rxjs';
import { GAME_EMPTY_COVER } from '../../config/common.constant';
import { GameSearchItem } from '../../interfaces/game';
import { DestroyService } from '../../services/destroy.service';
import { GameService } from '../../services/game.service';
import { UserAgentService } from '../../services/user-agent.service';

@Component({
  selector: 'app-game-related',
  imports: [NgFor, RouterLink],
  providers: [DestroyService],
  templateUrl: './game-related.component.html'
})
export class GameRelatedComponent implements OnInit {
  readonly emptyCover = GAME_EMPTY_COVER;

  isMobile = false;
  relatedGames: GameSearchItem[] = [];

  private gameId = '';
  private isChanged = false;
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
