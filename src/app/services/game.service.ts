import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from '../config/api-url';
import { APP_ID, REGEXP_ID } from '../config/common.constant';
import { STORAGE_KEY_GAME_PREFIX, STORAGE_KEY_GAMES } from '../config/game.constant';
import {
  Game,
  GameCachedItem,
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

  getCachedGames() {
    const games: Array<{ [id: string]: string }> = [];

    Object.keys(localStorage).forEach((key) => {
      const keys = key.split(STORAGE_KEY_GAME_PREFIX);
      if (keys[0] === '' && REGEXP_ID.test(keys[1])) {
        games.push({
          [keys[0]]: localStorage.getItem(key) || ''
        });
      }
    });

    return games;
  }

  getCachedGameCount(): number {
    let count = 0;
    Object.keys(localStorage).forEach((key) => {
      const keys = key.split(STORAGE_KEY_GAME_PREFIX);
      if (keys[0] === '' && REGEXP_ID.test(keys[1]) && localStorage.getItem(key)) {
        count += 1;
      }
    });

    return count;
  }

  cacheGame(gameId: string, game: Blob) {
    const cachedGames = this.getCachedGameList().filter((game) => this.isGameCached(game.id));
    if (cachedGames.length >= 5) {
      localStorage.removeItem(STORAGE_KEY_GAME_PREFIX + cachedGames[0].id);
    }
    game
      .arrayBuffer()
      .then((gameBuffer) => {
        const uint8Array = new Uint8Array(gameBuffer);
        const gameStr = String.fromCharCode(...uint8Array);

        localStorage.setItem(STORAGE_KEY_GAME_PREFIX + gameId, gameStr);
      })
      .catch(() => {});
  }

  getCachedGame(gameId: string) {
    return localStorage.getItem(STORAGE_KEY_GAME_PREFIX + gameId);
  }

  isGameCached(gameId: string): boolean {
    return !!this.getCachedGame(gameId);
  }

  getCachedGameList(): GameCachedItem[] {
    try {
      const games: GameCachedItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY_GAMES) || '[]');

      return games.sort((a, b) => (a.added < b.added ? -1 : 1));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return [];
    }
  }

  cacheGameList(game: GameCachedItem) {
    try {
      const cachedGames = this.getCachedGameList();
      const cachedGame = cachedGames.find((item) => item.id === game.id);
      if (cachedGame) {
        // 先删除
        cachedGames.splice(cachedGames.indexOf(cachedGame), 1);
        // 再重新缓存
        cachedGames.push(game);
        localStorage.setItem(STORAGE_KEY_GAMES, JSON.stringify(cachedGames));
        return;
      }
      if (cachedGames.length >= 10) {
        cachedGames.shift();
      }
      cachedGames.push(game);
      localStorage.setItem(STORAGE_KEY_GAMES, JSON.stringify(cachedGames));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {}
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
