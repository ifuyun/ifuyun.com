import { HttpStatusCode } from '@angular/common/http';
import { ErrorHandler, Inject, Injectable, Optional, RESPONSE_INIT } from '@angular/core';
import { Response } from 'express';
import { environment } from '../environments/environment';
import { Message } from './config/message.enum';
import { CustomError } from './interfaces/custom-error';
import { ErrorService } from './services/error.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(
    @Optional() @Inject(RESPONSE_INIT) private readonly response: Response,
    private readonly errorService: ErrorService
  ) {}

  handleError(error: Error | CustomError): void {
    const status = error instanceof CustomError ? error.getStatus() : HttpStatusCode.InternalServerError;
    const message = error instanceof CustomError ? error.getResponse() : error.message;

    let defaultMessage = '';
    switch (status) {
      case 400:
        defaultMessage = Message.ERROR_400;
        break;
      case 403:
        defaultMessage = Message.ERROR_403;
        break;
      case 404:
        defaultMessage = Message.ERROR_404;
        break;
      default:
        defaultMessage = Message.ERROR_500;
        break;
    }

    if (this.response) {
      this.response.status = <any>status;
    }
    if (!environment.production) {
      console.error(
        `Status: %s\nMessage: %s\nStack: %s`,
        status,
        message || defaultMessage,
        error instanceof CustomError ? '' : `\n${error.stack}`
      );
    }
    this.errorService.updateErrorState({
      code: status,
      message: message || defaultMessage,
      visible: true
    });
  }
}
