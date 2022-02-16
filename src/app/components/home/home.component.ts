import { Component, OnInit } from '@angular/core';
import { PostsService } from "../../services/posts.service";
import { Observable } from "rxjs";
import { PostModel } from "../../models/post.model";
import { map } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent implements OnInit {
  posts: any[] = [];

  constructor(
    private postsService: PostsService
  ) {
  }

  ngOnInit(): void {
    this.postsService.getPosts().subscribe((res) => {
      this.posts = res.posts;
    });
  }
}
