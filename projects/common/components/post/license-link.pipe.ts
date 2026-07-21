import { Pipe, PipeTransform } from '@angular/core';
import { PostLicense } from 'common/enums';
import { POST_LICENSE_LINK } from './post.constant';

@Pipe({
  name: 'licenseLink'
})
export class LicenseLinkPipe implements PipeTransform {
  transform(value: number): string {
    value = value || PostLicense.COMMERCIAL;

    return POST_LICENSE_LINK.get(value) || '';
  }
}
