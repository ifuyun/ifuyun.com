import { Params } from '@angular/router';

export interface BreadcrumbEntity {
  label: string;
  url: string;
  domain?: string;
  tooltip: string;
  isHeader: boolean;
  slug?: string;
  param?: Params;
}
