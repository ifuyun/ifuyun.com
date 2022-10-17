import { Inject, Injectable, Optional } from '@angular/core';
import { RESPONSE } from '@nestjs/ng-universal/dist/tokens';
import { Response } from 'express';

@Injectable({
  providedIn: 'root'
})
export class ResponseService {
  constructor(@Optional() @Inject(RESPONSE) protected response: Response) {}

  setStatus(code: number): void {
    this.response.status(code);
  }
}
