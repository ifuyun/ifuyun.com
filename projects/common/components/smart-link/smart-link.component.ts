import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Params, RouterModule, UrlTree } from '@angular/router';
import { CommonService } from 'common/services';

@Component({
  selector: 'lib-a',
  imports: [CommonModule, RouterModule],
  template: `
    <ng-template #contentTpl><ng-content /></ng-template>
    @if (isAbsoluteUrl) {
      <a [href]="href" [title]="title" [attr.target]="target" [attr.rel]="rel">
        <ng-container *ngTemplateOutlet="contentTpl"></ng-container>
      </a>
    } @else {
      <a
        [routerLink]="href"
        [queryParams]="queryParams"
        [fragment]="fragment"
        [title]="title"
        [attr.target]="target"
        [attr.rel]="rel"
      >
        <ng-container *ngTemplateOutlet="contentTpl"></ng-container>
      </a>
    }
  `,
  styles: [
    `
      a {
        align-items: center;
        color: var(--lib-a-color, inherit);
        display: var(--lib-a-display, inline-flex);
        flex-grow: var(--lib-a-flex-glow, unset);
        height: var(--lib-a-height, unset);
        max-width: 100%;
        min-width: var(--lib-a-min-width, unset);
        overflow: hidden;
        padding: var(--lib-a-padding, unset);
        text-overflow: ellipsis;
        white-space: nowrap;
        width: var(--lib-a-width, unset);
      }
    `
  ]
})
export class SmartLinkComponent implements OnInit {
  @Input() href?: any[] | string | UrlTree | null;
  @Input() queryParams?: Params | null;
  @Input() fragment?: string;
  @Input() title?: string = '';
  @Input() target?: string;
  @Input() rel?: string;

  isAbsoluteUrl = false;

  constructor(private readonly commonService: CommonService) {}

  ngOnInit(): void {
    if (typeof this.href !== 'string' || !/^https?:\/\//i.test(this.href)) {
      this.isAbsoluteUrl = false;
    } else {
      const curHost = this.commonService.getHost();
      const url = new URL(this.href);
      const urlHost = url.host;

      this.isAbsoluteUrl = curHost !== urlHost;

      if (!this.isAbsoluteUrl) {
        this.href = decodeURIComponent(url.pathname) + url.search + url.hash;
      }
    }
  }
}
