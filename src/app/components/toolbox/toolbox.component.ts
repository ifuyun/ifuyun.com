import { Component, OnDestroy, OnInit } from '@angular/core';
import { isEmpty } from 'lodash';
import { skipWhile, Subscription } from 'rxjs';
import { OptionEntity } from '../../interfaces/options';
import { OptionsService } from '../../services/options.service';

@Component({
  selector: 'i-toolbox',
  templateUrl: './toolbox.component.html',
  styleUrls: ['./toolbox.component.less']
})
export class ToolboxComponent implements OnInit, OnDestroy {
  options: OptionEntity = {};
  wallpaperVisible = false;

  private optionsListener!: Subscription;

  constructor(private optionsService: OptionsService) {}

  ngOnInit(): void {
    this.optionsListener = this.optionsService.options$
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
