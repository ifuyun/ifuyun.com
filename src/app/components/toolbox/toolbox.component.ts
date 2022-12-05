import { Component, OnDestroy, OnInit } from '@angular/core';
import { isEmpty } from 'lodash';
import { skipWhile, Subscription } from 'rxjs';
import { Theme } from '../../config/common.enum';
import { CommonService } from '../../core/common.service';
import { OptionEntity } from '../../interfaces/option.interface';
import { OptionService } from '../../services/option.service';

@Component({
  selector: 'i-toolbox',
  templateUrl: './toolbox.component.html',
  styleUrls: ['./toolbox.component.less']
})
export class ToolboxComponent implements OnInit, OnDestroy {
  options: OptionEntity = {};
  wallpaperVisible = false;
  darkMode = false;

  private optionsListener!: Subscription;

  constructor(private optionService: OptionService, private commonService: CommonService) {}

  ngOnInit(): void {
    this.optionsListener = this.optionService.options$
      .pipe(skipWhile((options) => isEmpty(options)))
      .subscribe((options) => (this.options = options));
    this.darkMode = this.commonService.getTheme() === Theme.Dark;
  }

  ngOnDestroy(): void {
    this.optionsListener.unsubscribe();
  }

  openWallpaper() {
    this.wallpaperVisible = true;
  }

  changeTheme() {
    const theme = this.darkMode ? Theme.Light : Theme.Dark;
    this.commonService.updateTheme(theme);
    this.darkMode = !this.darkMode;
  }
}
