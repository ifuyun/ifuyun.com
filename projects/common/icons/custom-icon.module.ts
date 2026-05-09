import { NgModule } from '@angular/core';
import { IconCalendarDateComponent } from './icon-calendar-date.component';
import { IconChatSquareDotsComponent } from './icon-chat-square-dots.component';
import { IconChatSquareComponent } from './icon-chat-square.component';
import { IconCheckLgComponent } from './icon-check-lg.component';
import { IconCopyComponent } from './icon-copy.component';
import { IconDownloadComponent } from './icon-download.component';
import { IconFullscreenExitComponent } from './icon-fullscreen-exit.component';
import { IconFullscreenComponent } from './icon-fullscreen.component';
import { IconLockComponent } from './icon-lock.component';
import { IconPencilComponent } from './icon-pencil.component';
import { IconPlayFillComponent } from './icon-play-fill.component';
import { IconRssComponent } from './icon-rss.component';
import { IconShareFillComponent } from './icon-share-fill.component';
import { IconStarsComponent } from './icon-stars.component';
import { IconStopFillComponent } from './icon-stop-fill.component';
import { IconTrophyFillComponent } from './icon-trophy-fill.component';

const icons = [
  IconCalendarDateComponent,
  IconChatSquareComponent,
  IconChatSquareDotsComponent,
  IconCheckLgComponent,
  IconCopyComponent,
  IconDownloadComponent,
  IconFullscreenComponent,
  IconFullscreenExitComponent,
  IconLockComponent,
  IconPencilComponent,
  IconPlayFillComponent,
  IconRssComponent,
  IconShareFillComponent,
  IconStarsComponent,
  IconStopFillComponent,
  IconTrophyFillComponent
];

@NgModule({
  imports: icons,
  exports: icons
})
export class CustomIconModule {}
