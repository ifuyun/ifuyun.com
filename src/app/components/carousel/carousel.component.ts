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
  imgList: { url: string; title: string; caption: string; }[] = [];
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
        title: '风车',
        caption: '舟山朱家尖·风车'
      }, {
        url: '/assets/banners/sunset.jpg',
        title: '日落',
        caption: '飞机上的日落'
      }, {
        url: '/assets/banners/flowers.jpg',
        title: '花',
        caption: '杭州植物园·菊花艺术节'
      }, {
        url: '/assets/banners/fireworks.jpg',
        title: '烟花',
        caption: '西湖·烟花大会'
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
