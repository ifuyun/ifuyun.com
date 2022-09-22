import { Component, OnDestroy, OnInit } from '@angular/core';
import { isEmpty } from 'lodash';
import { skipWhile, Subscription } from 'rxjs';
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

  private optionsListener!: Subscription;

  constructor(private optionService: OptionService) {}

  ngOnInit(): void {
    this.optionsListener = this.optionService.options$
      .pipe(skipWhile((options) => isEmpty(options)))
      .subscribe((options) => (this.options = options));
  }

  ngOnDestroy(): void {
    this.optionsListener.unsubscribe();
  }

  openWallpaper() {
    this.wallpaperVisible = true;
  }
}
