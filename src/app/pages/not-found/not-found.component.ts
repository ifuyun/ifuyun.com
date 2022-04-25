import { HttpStatusCode } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PlatformService } from '../../core/platform.service';
import { ResponseService } from '../../core/response.service';
import { OptionEntity } from '../../interfaces/options';
import { MetaService } from '../../core/meta.service';
import { OptionsService } from '../../services/options.service';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.less']
})
export class NotFoundComponent implements OnInit, OnDestroy {
  options: OptionEntity = {};
  curYear = new Date().getFullYear();

  private optionsListener!: Subscription;

  constructor(
    private platform: PlatformService,
    private response: ResponseService,
    private optionsService: OptionsService,
    private metaService: MetaService,
  ) {
  }

  ngOnInit(): void {
    if (this.platform.isServer) {
      this.response.setStatus(HttpStatusCode.NotFound);
    }
    this.optionsListener = this.optionsService.options$.subscribe((options) => {
      this.options = options;
      this.metaService.updateHTMLMeta({
        title: `404 - ${options?.['site_name']}`,
        description: options['site_description'],
        author: options?.['site_author'],
        keywords: options?.['site_keywords']
      });
    });
  }

  ngOnDestroy(): void {
    this.optionsListener.unsubscribe();
  }
}
