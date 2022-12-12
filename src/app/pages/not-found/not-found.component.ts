import { HttpStatusCode } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { isEmpty } from 'lodash';
import { skipWhile, Subscription } from 'rxjs';
import { CommonService } from '../../core/common.service';
import { PageComponent } from '../../core/page.component';
import { PlatformService } from '../../core/platform.service';
import { ResponseService } from '../../core/response.service';
import { OptionEntity } from '../../interfaces/option.interface';
import { MetaService } from '../../core/meta.service';
import { OptionService } from '../../services/option.service';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.less']
})
export class NotFoundComponent extends PageComponent implements OnInit, OnDestroy {
  options: OptionEntity = {};
  curYear = new Date().getFullYear();

  protected pageIndex = '404';

  private optionsListener!: Subscription;

  constructor(
    private platform: PlatformService,
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
    this.optionsListener = this.optionService.options$
      .pipe(skipWhile((options) => isEmpty(options)))
      .subscribe((options) => {
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
