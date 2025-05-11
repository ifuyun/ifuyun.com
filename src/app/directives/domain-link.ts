import { LocationStrategy } from '@angular/common';
import {
  Attribute,
  booleanAttribute,
  Directive,
  ElementRef,
  HostAttributeToken,
  HostBinding,
  HostListener,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Renderer2,
  signal,
  untracked,
  ɵINTERNAL_APPLICATION_ERROR_HANDLER,
  ɵRuntimeError as RuntimeError
} from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Params,
  QueryParamsHandling,
  Router,
  ROUTER_CONFIGURATION,
  UrlTree
} from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { environment } from 'src/environments/environment';

@Directive({
  selector: '[domainLink]',
  host: {
    '[attr.href]': 'reactiveHref()'
  }
})
export class DomainLink implements OnChanges, OnDestroy {
  protected readonly reactiveHref = signal<string | null>(null);

  get href() {
    return untracked(this.reactiveHref);
  }

  set href(value: string | null) {
    this.reactiveHref.set(value);
  }

  @HostBinding('attr.target') @Input() target?: string;

  @Input() queryParams?: Params | null;
  @Input() fragment?: string;
  @Input() queryParamsHandling?: QueryParamsHandling | null;
  @Input() state?: { [k: string]: any };
  @Input() info?: unknown;
  @Input() relativeTo?: ActivatedRoute | null;

  private isAnchorElement: boolean;

  private subscription?: Subscription;

  onChanges = new Subject<DomainLink>();

  private readonly applicationErrorHandler = inject(ɵINTERNAL_APPLICATION_ERROR_HANDLER);
  private readonly options = inject(ROUTER_CONFIGURATION, { optional: true });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    @Attribute('tabindex') private readonly tabIndexAttribute: string | null | undefined,
    private readonly renderer: Renderer2,
    private readonly el: ElementRef,
    private readonly commonService: CommonService,
    private locationStrategy?: LocationStrategy
  ) {
    this.reactiveHref.set(inject(new HostAttributeToken('href'), { optional: true }));
    const tagName = el.nativeElement.tagName?.toLowerCase();
    this.isAnchorElement =
      tagName === 'a' ||
      tagName === 'area' ||
      !!(
        typeof customElements === 'object' &&
        (customElements.get(tagName) as { observedAttributes?: string[] } | undefined)?.observedAttributes?.includes?.(
          'href'
        )
      );

    if (!this.isAnchorElement) {
      this.subscribeToNavigationEventsIfNecessary();
    } else {
      this.setTabIndexIfNotOnNativeEl('0');
    }
  }

  private subscribeToNavigationEventsIfNecessary() {
    if (this.subscription !== undefined || !this.isAnchorElement) {
      return;
    }

    let createSubcription = this.preserveFragment;
    const dependsOnRouterState = (handling?: QueryParamsHandling | null) =>
      handling === 'merge' || handling === 'preserve';
    createSubcription ||= dependsOnRouterState(this.queryParamsHandling);
    createSubcription ||= !this.queryParamsHandling && !dependsOnRouterState(this.options?.defaultQueryParamsHandling);
    if (!createSubcription) {
      return;
    }

    this.subscription = this.router.events.subscribe((s) => {
      if (s instanceof NavigationEnd) {
        this.updateHref();
      }
    });
  }

  @Input({ transform: booleanAttribute }) preserveFragment: boolean = false;

  @Input({ transform: booleanAttribute }) skipLocationChange: boolean = false;

  @Input({ transform: booleanAttribute }) replaceUrl: boolean = false;

  private setTabIndexIfNotOnNativeEl(newTabIndex: string | null) {
    if (this.tabIndexAttribute != null /* both `null` and `undefined` */ || this.isAnchorElement) {
      return;
    }
    this.applyAttributeValue('tabindex', newTabIndex);
  }

  ngOnChanges() {
    if (
      ngDevMode &&
      this.isUrlTree(this.domainLinkInput) &&
      (this.fragment !== undefined ||
        this.queryParams ||
        this.queryParamsHandling ||
        this.preserveFragment ||
        this.relativeTo)
    ) {
      throw new RuntimeError(
        4567,
        'Cannot configure queryParams or fragment when using a UrlTree as the domainLink input value.'
      );
    }
    if (this.isAnchorElement) {
      this.updateHref();
      this.subscribeToNavigationEventsIfNecessary();
    }
    this.onChanges.next(this);
  }

  private domainLinkInput: readonly any[] | UrlTree | null = null;

  @Input()
  set domainLink(commandsOrUrlTree: readonly any[] | string | UrlTree | null | undefined) {
    if (commandsOrUrlTree == null) {
      this.domainLinkInput = null;
      this.setTabIndexIfNotOnNativeEl(null);
    } else {
      if (this.isUrlTree(commandsOrUrlTree)) {
        this.domainLinkInput = commandsOrUrlTree;
      } else {
        this.domainLinkInput = Array.isArray(commandsOrUrlTree) ? commandsOrUrlTree : [commandsOrUrlTree];
      }
      this.setTabIndexIfNotOnNativeEl('0');
    }
  }

  @HostListener('click', ['$event.button', '$event.ctrlKey', '$event.shiftKey', '$event.altKey', '$event.metaKey'])
  onClick(button: number, ctrlKey: boolean, shiftKey: boolean, altKey: boolean, metaKey: boolean): boolean {
    const urlTree = this.urlTree;

    if (urlTree === null) {
      return true;
    }

    if (this.isAnchorElement) {
      if (button !== 0 || ctrlKey || shiftKey || altKey || metaKey) {
        return true;
      }

      if (typeof this.target === 'string' && this.target != '_self') {
        return true;
      }
    }

    const extras = {
      skipLocationChange: this.skipLocationChange,
      replaceUrl: this.replaceUrl,
      state: this.state,
      info: this.info
    };
    this.router.navigateByUrl(urlTree, extras)?.catch((e) => {
      this.applicationErrorHandler(e);
    });

    return !this.isAnchorElement;
  }

  ngOnDestroy(): any {
    this.subscription?.unsubscribe();
  }

  private updateHref(): void {
    const urlTree = this.urlTree;
    let url: string | null = null;
    let resultUrl = '';

    if (urlTree !== null && this.locationStrategy) {
      url = this.locationStrategy.prepareExternalUrl(this.router.serializeUrl(urlTree));

      const hostname = this.commonService.getHostname();
      const urlObj = new URL('http://localhost' + url);
      const urlPaths = urlObj.pathname.split('/');
      const subDomain = environment.domain[urlPaths[1]] || '';

      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        if (urlPaths[1] === 'post') {
          if (!urlPaths[2] || urlPaths[2] === 'category' || urlPaths[2] === 'tag' || urlPaths[2] === 'archive') {
            resultUrl = urlPaths.slice(2).join('/') + urlObj.search;
          } else {
            resultUrl = url;
          }
        } else {
          resultUrl = urlPaths.slice(2).join('/') + urlObj.search;
        }
        if (hostname !== subDomain) {
          resultUrl = subDomain + resultUrl;
        }
      } else {
        resultUrl = url;
      }
    }

    this.reactiveHref.set(resultUrl);
  }

  private applyAttributeValue(attrName: string, attrValue: string | null) {
    const renderer = this.renderer;
    const nativeElement = this.el.nativeElement;
    if (attrValue !== null) {
      renderer.setAttribute(nativeElement, attrName, attrValue);
    } else {
      renderer.removeAttribute(nativeElement, attrName);
    }
  }

  get urlTree(): UrlTree | null {
    if (this.domainLinkInput === null) {
      return null;
    } else if (this.isUrlTree(this.domainLinkInput)) {
      return this.domainLinkInput;
    }
    return this.router.createUrlTree([...this.domainLinkInput], {
      relativeTo: this.relativeTo !== undefined ? this.relativeTo : this.route,
      queryParams: this.queryParams,
      fragment: this.fragment,
      queryParamsHandling: this.queryParamsHandling,
      preserveFragment: this.preserveFragment
    });
  }

  private isUrlTree(v: any): v is UrlTree {
    return v instanceof UrlTree;
  }
}
