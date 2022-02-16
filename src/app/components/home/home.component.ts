import { Component, OnInit } from '@angular/core';
import { PostsService } from "../../services/posts.service";
import { Observable } from "rxjs";
import { PostModel } from "../../models/post.model";
import { map } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';
import { BaseComponent } from '../../core/base.component';
import { OptionsService } from '../../services/options.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent extends BaseComponent{
  options: Record<string, string> = {};
  posts: any[] = [];

  constructor(
    private postsService: PostsService,
    private optionsService: OptionsService
  ) {
    super();
  }

  ngOnInit(): void {
    this.optionsService.getOptions().subscribe((res) => {
      this.options = res;
    });
    this.postsService.getPosts().subscribe((res) => {
      this.posts = res.posts;
    });
  }
}
