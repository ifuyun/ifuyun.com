import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ErrorState } from '../interfaces/common';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private errorState: BehaviorSubject<ErrorState> = new BehaviorSubject<ErrorState>({
    visible: false,
    code: 0,
    message: ''
  });
  public errorState$: Observable<ErrorState> = this.errorState.asObservable();

  constructor() {}

  updateErrorState(error: ErrorState): void {
    this.errorState.next(error);
  }

  hideError() {
    this.errorState.next({
      visible: false,
      code: 0,
      message: ''
    });
  }
}
