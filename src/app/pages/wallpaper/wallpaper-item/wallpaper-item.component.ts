import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Params, RouterLink } from '@angular/router';
import { takeUntil } from 'rxjs';
import { BLANK_IMAGE } from '../../../config/common.constant';
import { DestroyService } from '../../../core/destroy.service';
import { NumberViewPipe } from '../../../pipes/number-view.pipe';
import { Wallpaper, WallpaperLang } from '../wallpaper.interface';

@Component({
  selector: 'i-wallpaper-item',
  standalone: true,
  providers: [DestroyService],
  imports: [CommonModule, RouterLink, NumberViewPipe],
  templateUrl: './wallpaper-item.component.html',
  styleUrls: []
})
export class WallpaperItemComponent implements OnInit {
  @Input() wallpaper!: Wallpaper;

  readonly blankImage = BLANK_IMAGE;

  private lang!: WallpaperLang;

  constructor(private route: ActivatedRoute, private destroy$: DestroyService) {}

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((queryParams) => {
      this.lang = <WallpaperLang>queryParams.get('lang')?.trim();
    });
  }

  getWallpaperLangParams(wallpaper: Wallpaper): Params {
    if (!this.lang) {
      return !!wallpaper.bingIdCn ? {} : { lang: WallpaperLang.EN };
    }
    return { lang: this.lang };
  }
}
