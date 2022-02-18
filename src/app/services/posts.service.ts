import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { PostModel } from "../models/post.model";
import { BaseApiService } from "../core/base-api.service";
import { HttpClient } from "@angular/common/http";
import { ApiUrl } from '../enums/api-url';

@Injectable({
  providedIn: 'root'
})
export class PostsService extends BaseApiService {
  constructor(protected http: HttpClient) {
    super();
  }

  getPosts(): Observable<any> {
    return this.httpGetData(this.getApiUrl(ApiUrl.GET_POSTS));
  }
}
