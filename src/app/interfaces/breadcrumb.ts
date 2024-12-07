import { Params } from '@angular/router';

export interface BreadcrumbEntity {
  label: string;
  url: string;
  tooltip: string;
  isHeader: boolean;
  slug?: string;
  param?: Params;
}
