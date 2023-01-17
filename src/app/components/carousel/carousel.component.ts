import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { isEmpty } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
import { DestroyService } from '../../core/destroy.service';
import { PlatformService } from '../../core/platform.service';
import { CarouselVo, OptionEntity } from '../../interfaces/option.interface';
import { OptionService } from '../../services/option.service';

@Component({
  selector: 'i-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.less'],
  providers: [DestroyService]
})
export class CarouselComponent implements OnInit, OnDestroy, AfterViewInit {
  options: OptionEntity = {};
  carousels: CarouselVo[] = [];
  activeIndex = 0;
  isRevert = false;
  timer!: any;
  staticResourceHost = '';

  constructor(
    private destroy$: DestroyService,
    private optionService: OptionService,
    private platform: PlatformService
  ) {}

  ngOnInit(): void {
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => {
        this.options = options;
        this.staticResourceHost = options['static_resource_host'];
        this.fetchData();
      });
  }

  ngOnDestroy() {
    this.stop();
  }

  ngAfterViewInit() {
    this.start();
  }

  switchBanner(index: number) {
    this.isRevert = index < this.activeIndex;
    this.activeIndex = index;
  }

  stop() {
    this.timer && clearInterval(this.timer);
  }

  start() {
    if (this.platform.isBrowser) {
      this.timer = setInterval(() => {
        this.isRevert = false;
        this.activeIndex = this.activeIndex + 1 >= this.carousels.length ? 0 : this.activeIndex + 1;
      }, 3000);
    }
  }

  private fetchData() {
    this.optionService
      .getCarousels()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.carousels = res;
        this.carousels.forEach((item) => {
          item.fullUrl = /^https?:\/\//i.test(item.url) ? item.url : this.staticResourceHost + item.url;
        });
      });
  }
}
