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

  constructor(private http: HttpClient) {
    super(http);
  }

  getPosts(): Observable<any> {
    return this.httpGet(this.getApiUrl(ApiUrl.GET_POSTS));
  }
}
