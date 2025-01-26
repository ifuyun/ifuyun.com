import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from '../config/api-url';
import { APP_ID } from '../config/common.constant';
import {
  Game,
  GameEntity,
  GameList,
  GameLogEntity,
  GameQueryParam,
  GameRelatedParam,
  GameSearchItem
} from '../interfaces/game';
import { HttpResponseEntity } from '../interfaces/http-response';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private activeGameId: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public activeGameId$: Observable<string> = this.activeGameId.asObservable();
  private activeRomURL: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public activeRomURL$: Observable<string> = this.activeRomURL.asObservable();

  constructor(private readonly apiService: ApiService) {}

  getGames(param: GameQueryParam): Observable<GameList> {
    return this.apiService
      .httpGet(ApiUrl.GAMES, {
        ...param,
        appId: APP_ID
      })
      .pipe(map((res) => res?.data || {}));
  }

  getHotGames(): Observable<GameEntity[]> {
    return this.apiService.httpGet(ApiUrl.GAME_HOT, {}).pipe(map((res) => res?.data || []));
  }

  getRandomGames(size: number): Observable<GameEntity[]> {
    return this.apiService
      .httpGet(ApiUrl.GAME_RANDOM, {
        size
      })
      .pipe(map((res) => res?.data || []));
  }

  getRelatedGames(param: GameRelatedParam): Observable<GameSearchItem[]> {
    return this.apiService.httpGet(ApiUrl.GAME_RELATED, param).pipe(map((res) => res?.data || []));
  }

  getGameById(gameId: string, ref?: string): Observable<Game> {
    const payload: Record<string, any> = {
      gameId,
      appId: APP_ID
    };
    if (ref?.trim()) {
      payload['ref'] = ref;
    }
    return this.apiService.httpGet(ApiUrl.GAME, payload).pipe(map((res) => res?.data));
  }

  getGameROM(gameId: string): Observable<Blob> {
    return this.apiService.httpGetFile(
      ApiUrl.GAME_ROM,
      {
        gameId,
        appId: APP_ID
      },
      true
    );
  }

  getGamesOfPrevAndNext(gameId: string): Observable<{ prevGame: GameEntity; nextGame: GameEntity }> {
    return this.apiService
      .httpGet(ApiUrl.GAME_PREV_AND_NEXT, {
        gameId
      })
      .pipe(map((res) => res?.data || {}));
  }

  checkPlay(): Observable<HttpResponseEntity> {
    return this.apiService.httpGet(ApiUrl.GAME_CHECK_PLAY, {}, true).pipe(map((res) => res || {}));
  }

  getGameDownloadUrl(gameId: string): Observable<string> {
    return this.apiService
      .httpGet(
        ApiUrl.GAME_DOWNLOAD_URL,
        {
          gameId
        },
        true
      )
      .pipe(map((res) => res?.data || ''));
  }

  updateActiveGameId(gameId: string) {
    this.activeGameId.next(gameId);
  }

  updateActiveRomURL(romURL: string) {
    this.activeRomURL.next(romURL);
  }

  saveGameLog(log: GameLogEntity): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(ApiUrl.GAME_LOG, log, false);
  }

  clean(romURL: string) {
    if ((<any>window)['EJS_emulator']) {
      (<any>window)['EJS_emulator'].pause();
    }
    if (romURL) {
      URL.revokeObjectURL(romURL);
    }
  }
}
