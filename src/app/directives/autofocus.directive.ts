import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[autofocus]'
})
export class AutofocusDirective {
  constructor(private host: ElementRef) {}

  ngAfterContentInit() {
    this.host.nativeElement.focus();
  }
}
