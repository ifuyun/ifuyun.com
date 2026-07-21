import { Pipe, PipeTransform } from '@angular/core';
import { PostLicense } from 'common/enums';
import { POST_LICENSE } from './post.constant';

@Pipe({
  name: 'license'
})
export class LicensePipe implements PipeTransform {
  transform(value: number): string {
    value = value || PostLicense.COMMERCIAL;

    return POST_LICENSE.get(value)?.title || '';
  }
}
