import { Component, OnInit } from '@angular/core';
import { isEmpty } from 'lodash';
import { NzImageService } from 'ng-zorro-antd/image';
import { skipWhile, takeUntil } from 'rxjs';
import { APP_ID, PATH_WECHAT_CARD, PATH_WECHAT_MINI_APP_CARD } from '../../config/common.constant';
import { Theme } from '../../config/common.enum';
import { CommonService } from '../../core/common.service';
import { DestroyService } from '../../core/destroy.service';
import { Action, ActionObjectType } from '../../interfaces/log.enum';
import { OptionEntity } from '../../interfaces/option.interface';
import { LogService } from '../../services/log.service';
import { OptionService } from '../../services/option.service';
import { WallpaperBoxComponent } from '../wallpaper-box/wallpaper-box.component';

@Component({
  selector: 'i-toolbox',
  templateUrl: './toolbox.component.html',
  styleUrls: ['./toolbox.component.less'],
  standalone: true,
  imports: [WallpaperBoxComponent],
  providers: [DestroyService]
})
export class ToolboxComponent implements OnInit {
  options: OptionEntity = {};
  wallpaperVisible = false;
  darkMode = false;

  constructor(
    private destroy$: DestroyService,
    private commonService: CommonService,
    private optionService: OptionService,
    private imageService: NzImageService,
    private logService: LogService
  ) {}

  ngOnInit(): void {
    this.commonService.darkMode$.pipe(takeUntil(this.destroy$)).subscribe((darkMode) => {
      this.darkMode = darkMode;
    });
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => (this.options = options));
    this.darkMode = this.commonService.getTheme() === Theme.Dark;
  }

  openWallpaper() {
    this.wallpaperVisible = true;
    this.logService
      .logAction({
        action: Action.SHOW_WALLPAPER_BOX,
        objectType: ActionObjectType.TOOLBOX,
        appId: APP_ID
      })
      .subscribe();
  }

  changeTheme() {
    const theme = this.darkMode ? Theme.Light : Theme.Dark;
    this.commonService.updateTheme(theme);
    this.logService
      .logAction({
        action: Action.CHANGE_THEME,
        objectType: ActionObjectType.TOOLBOX,
        theme,
        appId: APP_ID
      })
      .subscribe();
  }

  showWechatCard() {
    this.imageService.preview([
      {
        src: PATH_WECHAT_CARD
      }
    ]);
    this.logService
      .logAction({
        action: Action.SHOW_WECHAT_CARD,
        objectType: ActionObjectType.TOOLBOX,
        appId: APP_ID
      })
      .subscribe();
  }

  showMiniAppCard() {
    this.imageService.preview([
      {
        src: PATH_WECHAT_MINI_APP_CARD
      }
    ]);
    this.logService
      .logAction({
        action: Action.SHOW_MINI_APP_CARD,
        objectType: ActionObjectType.TOOLBOX,
        appId: APP_ID
      })
      .subscribe();
  }

  logRSS() {
    this.logService
      .logAction({
        action: Action.OPEN_RSS,
        objectType: ActionObjectType.TOOLBOX,
        appId: APP_ID
      })
      .subscribe();
  }
}
