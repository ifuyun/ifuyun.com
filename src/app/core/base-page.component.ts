export abstract class BasePageComponent {
  protected abstract pageIndex: string;

  protected abstract updateActivePage(): void;
}
