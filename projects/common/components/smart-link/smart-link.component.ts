import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, input, model, OnInit, signal } from '@angular/core';
import { Params, RouterLink, UrlTree } from '@angular/router';
import { CommonService } from 'common/services';

@Component({
  selector: 'lib-a',
  imports: [NgTemplateOutlet, RouterLink],
  template: `
    <ng-template #contentTpl><ng-content></ng-content></ng-template>
    @if (isAbsoluteUrl()) {
      <a [href]="href()" [title]="title()" [attr.target]="target()" [attr.rel]="rel()">
        <ng-container *ngTemplateOutlet="contentTpl"></ng-container>
      </a>
    } @else {
      <a
        [routerLink]="href()"
        [queryParams]="queryParams()"
        [fragment]="fragment()"
        [title]="title()"
        [attr.target]="target()"
        [attr.rel]="rel()"
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
  private readonly commonService = inject(CommonService);

  readonly href = model<any[] | string | UrlTree | null>(null);
  readonly queryParams = input<Params | null | undefined>(null);
  readonly fragment = input<string | undefined>(undefined);
  readonly title = input<string | undefined>(undefined);
  readonly target = input<string | undefined>(undefined);
  readonly rel = input<string | undefined>(undefined);

  readonly isAbsoluteUrl = signal(false);

  ngOnInit(): void {
    const href = this.href();

    if (typeof href !== 'string' || !/^https?:\/\//i.test(href)) {
      this.isAbsoluteUrl.set(false);
    } else {
      const curHost = this.commonService.getHost();
      const url = new URL(href);
      const urlHost = url.host;

      this.isAbsoluteUrl.set(curHost !== urlHost);

      if (!this.isAbsoluteUrl()) {
        this.href.set(decodeURIComponent(url.pathname) + url.search + url.hash);
      }
    }
  }
}
