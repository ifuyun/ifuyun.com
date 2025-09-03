import { Injectable } from '@angular/core';
import { AppConfigService } from 'common/core';
import { Bot } from 'common/interfaces';

@Injectable({
  providedIn: 'root'
})
export class BotService {
  constructor(private readonly appConfigService: AppConfigService) {}

  getBotAvatar(bot?: Bot): string {
    return bot?.botAvatar || this.appConfigService.faviconUrl;
  }
}
