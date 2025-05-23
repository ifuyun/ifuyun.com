import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppConfigService, AppDomainConfig, GAME_EMPTY_COVER, UserAgentService } from 'common/core';
import { ListMode } from 'common/enums';
import { Game } from 'common/interfaces';
import { NumberViewPipe } from 'common/pipes';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { SmartLinkComponent } from '../../smart-link/smart-link.component';
import { CommonService } from 'common/services';

@Component({
  selector: 'lib-game-item',
  imports: [NgIf, NgFor, RouterLink, NzIconModule, DatePipe, NumberViewPipe, SmartLinkComponent],
  templateUrl: './game-item.component.html',
  styleUrls: ['../../post/post-item/post-item.component.less', './game-item.component.less']
})
export class GameItemComponent {
  @Input() game!: Game;
  @Input() mode!: ListMode;
  @Input() index!: number;

  isMobile = false;
  domains!: AppDomainConfig;

  private defaultGameCover = '';

  get gameCover() {
    return this.game.game.gameCover || this.defaultGameCover;
  }

  get gameExcerpt() {
    const category = this.game.categories[0]?.taxonomyName;

    return this.game.game.gameExcerpt || `${category ? category + '游戏' : ''}“${this.game.game.gameTitle}”在线玩。`;
  }

  constructor(
    private readonly userAgentService: UserAgentService,
    private readonly commonService: CommonService,
    private readonly appConfigService: AppConfigService
  ) {
    this.isMobile = this.userAgentService.isMobile;
    this.domains = this.appConfigService.apps;
    this.defaultGameCover = this.commonService.getCdnUrlPrefix() + GAME_EMPTY_COVER;
  }
}
