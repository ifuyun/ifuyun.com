import { Component, OnInit } from '@angular/core';
import { isEmpty } from 'lodash';
import { NzImageService } from 'ng-zorro-antd/image';
import { skipWhile, takeUntil } from 'rxjs';
import { APP_ID, PATH_WECHAT_CARD } from '../../config/common.constant';
import { Theme } from '../../config/common.enum';
import { CommonService } from '../../core/common.service';
import { DestroyService } from '../../core/destroy.service';
import { ActionType, ActionObjectType } from '../../interfaces/log.enum';
import { TenantAppModel } from '../../interfaces/tenant-app.interface';
import { LogService } from '../../services/log.service';
import { TenantAppService } from '../../services/tenant-app.service';
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
  appInfo!: TenantAppModel;
  wallpaperVisible = false;
  darkMode = false;

  constructor(
    private destroy$: DestroyService,
    private commonService: CommonService,
    private tenantAppService: TenantAppService,
    private imageService: NzImageService,
    private logService: LogService
  ) {}

  ngOnInit(): void {
    this.commonService.darkMode$.pipe(takeUntil(this.destroy$)).subscribe((darkMode) => {
      this.darkMode = darkMode;
    });
    this.tenantAppService.appInfo$
      .pipe(
        skipWhile((appInfo) => isEmpty(appInfo)),
        takeUntil(this.destroy$)
      )
      .subscribe((appInfo) => (this.appInfo = appInfo));
    this.darkMode = this.commonService.getTheme() === Theme.Dark;
  }

  openWallpaper() {
    this.wallpaperVisible = true;
    this.logService
      .logAction({
        action: ActionType.SHOW_WALLPAPER_BOX,
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
        action: ActionType.CHANGE_THEME,
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
        action: ActionType.SHOW_WECHAT_CARD,
        objectType: ActionObjectType.TOOLBOX,
        appId: APP_ID
      })
      .subscribe();
  }

  logRSS() {
    this.logService
      .logAction({
        action: ActionType.OPEN_RSS,
        objectType: ActionObjectType.TOOLBOX,
        appId: APP_ID
      })
      .subscribe();
  }
}
