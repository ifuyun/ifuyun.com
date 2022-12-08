import { BaseComponent } from './base.component';

export abstract class PageComponent extends BaseComponent {
  protected abstract pageIndex: string;

  protected abstract updateActivePage(): void;

  protected abstract updatePageOptions(): void;
}
