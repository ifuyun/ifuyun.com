import { HttpStatusCode } from '@angular/common/http';
import { ErrorHandler, Inject, Injectable, Optional, RESPONSE_INIT } from '@angular/core';
import { Response } from 'express';
import { AppConfigService } from './app-config.service';
import { CustomError } from './custom-error';
import { ErrorService } from './error.service';
import { Message } from './message.enum';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  protected status?: number;
  protected message = '';

  constructor(
    @Optional() @Inject(RESPONSE_INIT) private readonly response: Response,
    private readonly appConfigService: AppConfigService,
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

    this.status = status;
    this.message = message || defaultMessage;

    if (this.response) {
      this.response.status = <any>this.status;
    }
    if (this.appConfigService.isDev) {
      console.error(
        `Time: %s\nStatus: %s\nMessage: %s\nStack: %s`,
        new Date(),
        this.status,
        this.message,
        error instanceof CustomError ? '' : `\n${error.stack}`
      );
    }
    this.errorService.updateErrorState({
      code: this.status,
      message: this.message,
      visible: true
    });
  }
}
