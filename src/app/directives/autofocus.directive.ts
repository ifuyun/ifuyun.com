import { AfterContentInit, Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[autofocus]',
  standalone: true
})
export class AutofocusDirective implements AfterContentInit {
  @Input() autofocus = false;

  constructor(private host: ElementRef) {}

  ngAfterContentInit() {
    if (this.autofocus) {
      this.host.nativeElement.focus();
    }
  }
}
