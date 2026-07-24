import { AfterViewInit, Component, computed, inject, input, OnDestroy, OnInit, output, signal } from '@angular/core';
import { AppConfigService, DestroyService, PlatformService, ScriptLoaderService, UserAgentService } from 'common/core';
import { GameLogType } from 'common/enums';
import { GameEntity } from 'common/interfaces';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { takeUntil } from 'rxjs';
import { DEFAULT_GAME_CONTROLS } from '../game.constant';
import { GameService } from '../game.service';

@Component({
  selector: 'lib-game-modal',
  imports: [NzModalModule],
  providers: [DestroyService],
  templateUrl: './game-modal.component.html',
  styleUrl: './game-modal.component.less'
})
export class GameModalComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly game = input.required<GameEntity>();
  readonly close = output<void>();

  readonly modalWidth = 800;
  readonly modalHeight = signal((this.modalWidth * 2) / 3);

  private readonly isMobile = computed(() => this.uaService.isMobile);
  private readonly romURL = signal('');

  private readonly destroy$ = inject(DestroyService);
  private readonly platform = inject(PlatformService);
  private readonly uaService = inject(UserAgentService);
  private readonly appConfigService = inject(AppConfigService);
  private readonly gameService = inject(GameService);
  private readonly scriptLoaderService = inject(ScriptLoaderService);

  ngOnInit(): void {
    if (this.platform.isBrowser && this.isMobile()) {
      this.modalHeight.set(document.body.clientHeight - 87);
    }
  }

  ngAfterViewInit(): void {
    this.getGameROM();
  }

  ngOnDestroy() {
    this.closeGameModal();
  }

  closeGameModal() {
    this.gameService.clean(this.romURL());
    this.close.emit();
  }

  private getGameROM(): void {
    const game = this.game();
    const cachedGame = this.gameService.getCachedGame(game.id);
    if (cachedGame) {
      const uint8Array = new Uint8Array(cachedGame.length);
      for (let i = 0; i < cachedGame.length; i++) {
        uint8Array[i] = cachedGame.charCodeAt(i);
      }
      this.initROM(new Blob([uint8Array], { type: 'application/octet-stream' }));
      this.logGame();
      // 刷新缓存
      this.gameService.cacheGameList({
        id: game.id,
        name: game.title,
        added: Date.now()
      });
    } else {
      this.gameService
        .getGameROM(game.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          this.initROM(res);
          this.logGame();
          // 缓存游戏
          this.gameService.cacheGame(game.id, res);
          this.gameService.cacheGameList({
            id: game.id,
            name: game.title,
            added: Date.now()
          });
        });
    }
  }

  private initROM(rom: Blob) {
    const game = this.game();

    this.romURL.set(URL.createObjectURL(rom));
    this.gameService.updateActiveRomURL(this.romURL());

    (<any>window)['EJS_gameID'] = game.id;
    (<any>window)['EJS_gameName'] = game.title;
    (<any>window)['EJS_player'] = '#game-box';
    (<any>window)['EJS_core'] = game.type;
    (<any>window)['EJS_pathtodata'] = this.appConfigService.emulatorBasePath;
    (<any>window)['EJS_gameUrl'] = this.romURL();
    (<any>window)['EJS_language'] = 'zh';
    (<any>window)['EJS_startOnLoaded'] = true;
    (<any>window)['EJS_defaultControls'] = DEFAULT_GAME_CONTROLS;
    (<any>window)['EJS_Buttons'] = {
      playPause: true,
      restart: true,
      mute: true,
      settings: true,
      fullscreen: true,
      saveState: true,
      loadState: true,
      screenRecord: true,
      gamepad: true,
      cheat: true,
      volume: true,
      saveSavFiles: true,
      loadSavFiles: true,
      quickSave: true,
      quickLoad: true,
      screenshot: true,
      cacheManager: false,
      exitEmulation: false
    };

    this.scriptLoaderService.loadScript(this.appConfigService.emulatorLoaderPath, true).then(() => {});
  }

  private logGame() {
    this.gameService
      .saveGameLog({
        type: GameLogType.PLAY,
        gameId: this.game().id
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }
}
