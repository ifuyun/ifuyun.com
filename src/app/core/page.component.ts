export abstract class PageComponent {
  protected abstract pageIndex: string;

  protected abstract updateActivePage(): void;
}
