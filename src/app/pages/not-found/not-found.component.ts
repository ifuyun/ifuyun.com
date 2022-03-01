import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { POST_DESCRIPTION_LENGTH } from '../../config/constants';
import { cutStr, filterHtmlTag } from '../../helpers/helper';
import { OptionEntity } from '../../interfaces/options';
import { CustomMetaService } from '../../services/custom-meta.service';
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
    private optionsService: OptionsService,
    private metaService: CustomMetaService
  ) {
  }

  ngOnInit(): void {
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
