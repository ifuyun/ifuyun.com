import { Pipe, PipeTransform } from '@angular/core';
import { COPY_TYPE } from '../config/copyright.constant';
import { CopyType } from '../enums/copyright';

@Pipe({
  name: 'copyType'
})
export class CopyTypePipe implements PipeTransform {
  transform(value: string): string {
    value = value || CopyType.COMMERCIAL;
    return COPY_TYPE[value] || value.toString();
  }
}
