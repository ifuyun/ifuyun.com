import { HttpStatusCode } from '@angular/common/http';
import { Component, Inject, OnInit, Optional } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RESPONSE } from '@nestjs/ng-universal/dist/tokens';
import { Response } from 'express';
import { isEmpty } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
import { CommonService } from '../../core/common.service';
import { DestroyService } from '../../core/destroy.service';
import { MetaService } from '../../core/meta.service';
import { PageComponent } from '../../core/page.component';
import { PlatformService } from '../../core/platform.service';
import { OptionEntity } from '../../interfaces/option.interface';
import { OptionService } from '../../services/option.service';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.less'],
  standalone: true,
  imports: [RouterLink],
  providers: [DestroyService]
})
export class NotFoundComponent extends PageComponent implements OnInit {
  options: OptionEntity = {};

  protected pageIndex = '404';

  constructor(
    private platform: PlatformService,
    private destroy$: DestroyService,
    private metaService: MetaService,
    private commonService: CommonService,
    private optionService: OptionService,
    @Optional() @Inject(RESPONSE) private response: Response
  ) {
    super();
    if (this.platform.isServer) {
      this.response.status(HttpStatusCode.NotFound);
    }
  }

  ngOnInit(): void {
    this.updatePageOptions();
    this.updateActivePage();
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => {
        this.options = options;
        this.metaService.updateHTMLMeta({
          title: `404 - ${options['site_name']}`,
          description: options['site_description'],
          author: options['site_author'],
          keywords: options['site_keywords']
        });
      });
  }

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.pageIndex);
  }

  protected updatePageOptions(): void {
    this.commonService.updatePageOptions({
      showHeader: true,
      showFooter: true,
      showMobileHeader: true,
      showMobileFooter: true
    });
  }
}
