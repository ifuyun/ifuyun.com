import { Pipe, PipeTransform } from '@angular/core';
import { COPYRIGHT_TYPE, DEFAULT_COPYRIGHT_TYPE } from '../config/constants';

@Pipe({
  name: 'copyrightType'
})
export class CopyrightTypePipe implements PipeTransform {
  transform(value: string): string {
    value = value || DEFAULT_COPYRIGHT_TYPE;
    return COPYRIGHT_TYPE[value] || value.toString();
  }
}
