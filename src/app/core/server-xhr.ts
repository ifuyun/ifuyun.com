import { XhrFactory } from '@angular/common';
// @ts-ignore
import * as XHR2 from 'xhr2';

// activate cookie for server-side rendering
export class ServerXhr implements XhrFactory {
  build(): XMLHttpRequest {
    XHR2.prototype._restrictedHeaders.cookie = false;
    return new XHR2.XMLHttpRequest();
  }
}
