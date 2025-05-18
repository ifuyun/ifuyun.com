import { Pipe, PipeTransform } from '@angular/core';
import { CopyType } from 'common/enums';
import { COPY_LINK } from './copyright.constant';

@Pipe({
  name: 'copyLink'
})
export class CopyLinkPipe implements PipeTransform {
  transform(value: string): string {
    value = value || CopyType.COMMERCIAL;
    return COPY_LINK[value] || value.toString();
  }
}
