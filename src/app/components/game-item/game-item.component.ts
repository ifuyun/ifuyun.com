import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { GAME_EMPTY_COVER } from '../../config/common.constant';
import { ListMode } from '../../enums/common';
import { Game } from '../../interfaces/game';
import { NumberViewPipe } from '../../pipes/number-view.pipe';
import { UserAgentService } from '../../services/user-agent.service';

@Component({
  selector: 'app-game-item',
  imports: [NgIf, NgFor, RouterLink, NzIconModule, DatePipe, NumberViewPipe],
  templateUrl: './game-item.component.html',
  styleUrls: ['../post-item/post-item.component.less', './game-item.component.less']
})
export class GameItemComponent {
  @Input() game!: Game;
  @Input() mode!: ListMode;
  @Input() index!: number;

  isMobile = false;

  get gameCover() {
    return this.game.game.gameCover || GAME_EMPTY_COVER;
  }

  get gameExcerpt() {
    const category = this.game.categories[0]?.taxonomyName;

    return this.game.game.gameExcerpt || `${category ? category + '游戏' : ''}“${this.game.game.gameTitle}”在线玩。`;
  }

  constructor(private readonly userAgentService: UserAgentService) {
    this.isMobile = this.userAgentService.isMobile;
  }
}
