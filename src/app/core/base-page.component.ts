import { BaseComponent } from './base.component';

export abstract class BasePageComponent extends BaseComponent {
  protected abstract pageIndex: string;

  protected abstract updateActivePage(): void;
}
