import { HttpStatusCode } from '@angular/common/http';
import { Component, Inject, OnDestroy, OnInit, Optional, PLATFORM_ID } from '@angular/core';
import { RESPONSE } from '@nguniversal/express-engine/tokens';
import { Response } from 'express';
import { Subscription } from 'rxjs';
import { BaseComponent } from '../../core/base.component';
import { OptionEntity } from '../../interfaces/options';
import { CustomMetaService } from '../../services/custom-meta.service';
import { OptionsService } from '../../services/options.service';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.less']
})
export class NotFoundComponent extends BaseComponent implements OnInit, OnDestroy {
  options: OptionEntity = {};
  curYear = new Date().getFullYear();

  private optionsListener!: Subscription;

  constructor(
    @Inject(PLATFORM_ID) protected platform: Object,
    @Optional() @Inject(RESPONSE) protected response: Response,
    private optionsService: OptionsService,
    private metaService: CustomMetaService,
  ) {
    super();
  }

  ngOnInit(): void {
    if (this.isPlatformServer()) {
      this.setStatus(HttpStatusCode.NotFound);
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
