import { Component, OnInit } from '@angular/core';
import { isEmpty } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
import { WECHAT_CARD_PATH } from '../../config/common.constant';
import { Theme } from '../../config/common.enum';
import { CommonService } from '../../core/common.service';
import { DestroyService } from '../../core/destroy.service';
import { OptionEntity } from '../../interfaces/option.interface';
import { OptionService } from '../../services/option.service';
import { ImageService } from '../image/image.service';

@Component({
  selector: 'i-toolbox',
  templateUrl: './toolbox.component.html',
  styleUrls: ['./toolbox.component.less'],
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
    private imageService: ImageService
  ) {}

  ngOnInit(): void {
    this.commonService.darkMode$.pipe(takeUntil(this.destroy$)).subscribe((darkMode) => {
      this.darkMode = darkMode;
    });
    this.optionService.options$
      .pipe(takeUntil(this.destroy$))
      .pipe(skipWhile((options) => isEmpty(options)))
      .subscribe((options) => (this.options = options));
    this.darkMode = this.commonService.getTheme() === Theme.Dark;
  }

  openWallpaper() {
    this.wallpaperVisible = true;
  }

  changeTheme() {
    const theme = this.darkMode ? Theme.Light : Theme.Dark;
    this.commonService.updateTheme(theme);
  }

  showWechatCard() {
    this.imageService.preview([
      {
        src: WECHAT_CARD_PATH
      }
    ]);
  }
}
