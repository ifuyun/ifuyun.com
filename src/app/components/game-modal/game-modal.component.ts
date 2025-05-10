import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { takeUntil } from 'rxjs';
import { DEFAULT_CONTROLS } from 'src/app/config/game.constant';
import { GameLogType } from 'src/app/enums/game';
import { GameEntity } from 'src/app/interfaces/game';
import { DestroyService } from 'src/app/services/destroy.service';
import { GameService } from 'src/app/services/game.service';
import { PlatformService } from 'src/app/services/platform.service';
import { ScriptLoaderService } from 'src/app/services/script-loader.service';
import { UserAgentService } from 'src/app/services/user-agent.service';

@Component({
  selector: 'app-game-modal',
  imports: [NzModalModule],
  providers: [DestroyService],
  templateUrl: './game-modal.component.html',
  styleUrl: './game-modal.component.less'
})
export class GameModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() game!: GameEntity;
  @Output() close = new EventEmitter();

  isMobile = false;
  modalWidth = 800;
  modalHeight = (this.modalWidth * 2) / 3;

  private romURL: string = '';

  constructor(
    private readonly destroy$: DestroyService,
    private readonly platform: PlatformService,
    private readonly userAgentService: UserAgentService,
    private readonly gameService: GameService,
    private readonly scriptLoaderService: ScriptLoaderService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngOnInit(): void {
    if (this.platform.isBrowser && this.isMobile) {
      this.modalHeight = document.body.clientHeight - 87;
    }
  }

  ngAfterViewInit(): void {
    this.getGameROM();
  }

  ngOnDestroy() {
    this.closeGameModal();
  }

  closeGameModal() {
    this.gameService.clean(this.romURL);
    this.close.emit();
  }

  private getGameROM(): void {
    const cachedGame = this.gameService.getCachedGame(this.game.gameId);
    if (cachedGame) {
      const uint8Array = new Uint8Array(cachedGame.length);
      for (let i = 0; i < cachedGame.length; i++) {
        uint8Array[i] = cachedGame.charCodeAt(i);
      }
      this.initROM(new Blob([uint8Array], { type: 'application/octet-stream' }));
      this.logGame();
      // 刷新缓存
      this.gameService.cacheGameList({
        id: this.game.gameId,
        name: this.game.gameTitle,
        added: Date.now()
      });
    } else {
      this.gameService
        .getGameROM(this.game.gameId)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          this.initROM(res);
          this.logGame();
          // 缓存游戏
          this.gameService.cacheGame(this.game.gameId, res);
          this.gameService.cacheGameList({
            id: this.game.gameId,
            name: this.game.gameTitle,
            added: Date.now()
          });
        });
    }
  }

  private initROM(rom: Blob) {
    this.romURL = URL.createObjectURL(rom);
    this.gameService.updateActiveRomURL(this.romURL);

    (<any>window)['EJS_gameID'] = this.game.gameId;
    (<any>window)['EJS_gameName'] = this.game.gameTitle;
    (<any>window)['EJS_player'] = '#game-box';
    (<any>window)['EJS_core'] = this.game.gameType;
    (<any>window)['EJS_gameUrl'] = this.romURL;
    (<any>window)['EJS_language'] = 'zh-CN';
    (<any>window)['EJS_startOnLoaded'] = true;
    (<any>window)['EJS_defaultControls'] = DEFAULT_CONTROLS;
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

    this.scriptLoaderService.loadScript('/assets/game/loader.min.js', true).then(() => {});
  }

  private logGame() {
    this.gameService
      .saveGameLog({
        gameLogType: GameLogType.PLAY,
        gameId: this.game.gameId
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }
}
