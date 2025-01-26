import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { takeUntil } from 'rxjs';
import { DEFAULT_CONTROLS } from '../../config/game.constant';
import { GameEntity } from '../../interfaces/game';
import { DestroyService } from '../../services/destroy.service';
import { GameService } from '../../services/game.service';
import { PlatformService } from '../../services/platform.service';
import { ScriptLoaderService } from '../../services/script-loader.service';
import { UserAgentService } from '../../services/user-agent.service';

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
    this.gameService
      .getGameROM(this.game.gameId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.romURL = URL.createObjectURL(res);
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
      });
  }
}
