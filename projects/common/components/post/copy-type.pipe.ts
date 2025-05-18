import { Pipe, PipeTransform } from '@angular/core';
import { CopyType } from 'common/enums';
import { COPY_TYPE } from './copyright.constant';

@Pipe({
  name: 'copyType'
})
export class CopyTypePipe implements PipeTransform {
  transform(value: string): string {
    value = value || CopyType.COMMERCIAL;
    return COPY_TYPE[value] || value.toString();
  }
}
