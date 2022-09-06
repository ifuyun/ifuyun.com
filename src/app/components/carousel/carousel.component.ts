import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { isEmpty } from 'lodash';
import { skipWhile, Subscription } from 'rxjs';
import { PlatformService } from '../../core/platform.service';
import { CarouselVo, OptionEntity } from '../../interfaces/options';
import { OptionsService } from '../../services/options.service';

@Component({
  selector: 'i-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.less']
})
export class CarouselComponent implements OnInit, OnDestroy, AfterViewInit {
  options: OptionEntity = {};
  carousels: CarouselVo[] = [];
  activeIndex = 0;
  isRevert = false;
  timer!: any;
  staticResourceHost = '';

  private optionsListener!: Subscription;
  private carouselsListener!: Subscription;

  constructor(private optionsService: OptionsService, private platform: PlatformService) {}

  ngOnInit(): void {
    this.optionsListener = this.optionsService.options$
      .pipe(skipWhile((options) => isEmpty(options)))
      .subscribe((options) => {
        this.options = options;
        this.staticResourceHost = options['static_resource_host'];
        this.fetchData();
      });
  }

  ngOnDestroy() {
    this.optionsListener.unsubscribe();
    this.carouselsListener.unsubscribe();
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
    this.carouselsListener = this.optionsService.getCarousels().subscribe((res) => {
      this.carousels = res;
      this.carousels.forEach((item) => {
        item.fullUrl = /^https?:\/\//i.test(item.url) ? item.url : this.staticResourceHost + item.url;
      });
    });
  }
}
