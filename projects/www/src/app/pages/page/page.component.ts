import { Component } from '@angular/core';
import { PostComponent } from 'common/components';
import { ContentType } from 'common/enums';

@Component({
  selector: 'app-page',
  imports: [PostComponent],
  template: `<lib-post [contentType]="contentType"></lib-post>`
})
export class PageComponent {
  contentType = ContentType.PAGE;
}
