import { DatePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { AppConfigService, GAME_EMPTY_COVER, UserAgentService } from 'common/core';
import { ListMode } from 'common/enums';
import { IconCalendarDateComponent, IconChatSquareComponent, IconChatSquareDotsComponent } from 'common/icons';
import { Game } from 'common/interfaces';
import { NumberViewPipe } from 'common/pipes';
import { CommonService } from 'common/services';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { SmartLinkComponent } from '../../smart-link/smart-link.component';

@Component({
  selector: 'lib-game-item',
  imports: [
    NzIconModule,
    DatePipe,
    NumberViewPipe,
    SmartLinkComponent,
    IconCalendarDateComponent,
    IconChatSquareDotsComponent,
    IconChatSquareComponent,
    IconCalendarDateComponent,
    IconChatSquareDotsComponent,
    IconChatSquareComponent
  ],
  templateUrl: './game-item.component.html',
  styleUrls: ['../../post/post-item/post-item.component.less', './game-item.component.less']
})
export class GameItemComponent {
  readonly game = input.required<Game>();
  readonly mode = input.required<ListMode>();
  readonly index = input.required<number>();

  readonly isMobile = computed(() => this.uaService.isMobile);
  readonly domains = computed(() => this.appConfigService.apps);
  readonly gameCover = computed(() => this.game().coverUrl || this.emptyCover());
  readonly gameExcerpt = computed(() => {
    const game = this.game();
    const category = game.categories[0]?.category.name;

    return game.summary || `${category ? category + '游戏' : ''}“${game.title}”在线玩。`;
  });

  private readonly emptyCover = computed(() => this.commonService.getCdnUrlPrefix() + GAME_EMPTY_COVER);

  private readonly uaService = inject(UserAgentService);
  private readonly commonService = inject(CommonService);
  private readonly appConfigService = inject(AppConfigService);
}
