import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml'
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}

  transform(html: string | undefined): SafeHtml {
    html = html || '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
