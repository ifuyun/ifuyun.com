import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PlatformService } from '../../core/platform.service';
import { OptionEntity } from '../../interfaces/options';
import { OptionsService } from '../../services/options.service';

@Component({
  selector: 'i-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.less']
})
export class CarouselComponent implements OnInit, OnDestroy, AfterViewInit {
  options: OptionEntity = {};
  imgList: { url: string; title: string; }[] = [];
  activeIndex = 0;
  isRevert = false;
  timer!: any;

  private optionsListener!: Subscription;

  constructor(
    private optionsService: OptionsService,
    private platform: PlatformService
  ) {
  }

  ngOnInit(): void {
    this.optionsListener = this.optionsService.options$.subscribe((options) => {
      this.options = options;
      this.imgList = [{
        url: '/assets/banners/windmill.jpg',
        title: this.options['site_name']
      }, {
        url: '/assets/banners/sunset.jpg',
        title: this.options['site_name']
      }, {
        url: '/assets/banners/flowers.jpg',
        title: this.options['site_name']
      }, {
        url: '/assets/banners/fireworks.jpg',
        title: this.options['site_name']
      }];
    });
  }

  ngOnDestroy() {
    this.optionsListener.unsubscribe();
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
        this.activeIndex = this.activeIndex + 1 >= this.imgList.length ? 0 : this.activeIndex + 1;
      }, 3000);
    }
  }
}
