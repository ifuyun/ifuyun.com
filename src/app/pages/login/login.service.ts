import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  gotoLogin(loginURL: string, isReplace = true) {
    if (isReplace) {
      location.replace(loginURL);
    } else {
      location.href = loginURL;
    }
  }
}
