import { Injectable } from '@angular/core';
import { LOGIN_URL } from '../../config/common.constant';
import { CommonService } from '../../core/common.service';
import { OptionEntity } from '../../interfaces/option.interface';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  constructor(private commonService: CommonService) {}

  gotoLogin(options: OptionEntity | string, param = '', isReplace = true) {
    const loginURL = typeof options === 'string' ? options : this.commonService.getURL(options, LOGIN_URL);
    if (isReplace) {
      location.replace(loginURL);
    } else {
      location.href = loginURL;
    }
  }
}
