import { HttpStatusCode } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { isEmpty } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
import { CommonService } from '../../core/common.service';
import { DestroyService } from '../../core/destroy.service';
import { MetaService } from '../../core/meta.service';
import { PageComponent } from '../../core/page.component';
import { PlatformService } from '../../core/platform.service';
import { ResponseService } from '../../core/response.service';
import { OptionEntity } from '../../interfaces/option.interface';
import { OptionService } from '../../services/option.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.less'],
  providers: [DestroyService],
  standalone: true,
  imports: [RouterLink]
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
    private response: ResponseService
  ) {
    super();
  }

  ngOnInit(): void {
    if (this.platform.isServer) {
      this.response.setStatus(HttpStatusCode.NotFound);
    }
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
