import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Optional, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { RESPONSE } from '@nguniversal/express-engine/tokens';
import { Response } from 'express';
import { NzMessageService } from 'ng-zorro-antd/message';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { BaseApiService } from '../core/base-api.service';
import { ApiUrl } from '../enums/api-url';
import { OptionEntity } from '../interfaces/options';

@Injectable({
  providedIn: 'root'
})
export class OptionsService extends BaseApiService {
  private options: BehaviorSubject<OptionEntity> = new BehaviorSubject<OptionEntity>({});
  public options$: Observable<OptionEntity> = this.options.asObservable();

  constructor(
    protected http: HttpClient,
    protected router: Router,
    protected message: NzMessageService,
    @Inject(PLATFORM_ID) protected platform: Object,
    @Optional() @Inject(RESPONSE) protected response: Response
  ) {
    super();
  }

  getOptions(): Observable<OptionEntity> {
    return this.httpGet(this.getApiUrl(ApiUrl.GET_OPTIONS)).pipe(
      map((res) => res.data || {}),
      tap((options) => {
        this.options.next(options);
      })
    );
  }
}
