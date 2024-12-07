import { Pipe, PipeTransform } from '@angular/core';
import { COPY_LINK } from '../config/copyright.constant';
import { CopyType } from '../enums/copyright';

@Pipe({
  name: 'copyLink'
})
export class CopyLinkPipe implements PipeTransform {
  transform(value: string): string {
    value = value || CopyType.COMMERCIAL;
    return COPY_LINK[value] || value.toString();
  }
}
