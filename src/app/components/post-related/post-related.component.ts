import { NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { skipWhile, takeUntil } from 'rxjs';
import { PostSearchItem } from '../../interfaces/post';
import { DestroyService } from '../../services/destroy.service';
import { PostService } from '../../services/post.service';
import { UserAgentService } from '../../services/user-agent.service';

@Component({
  selector: 'app-post-related',
  imports: [NgFor, RouterLink],
  providers: [DestroyService],
  templateUrl: './post-related.component.html',
  styleUrl: './post-related.component.less'
})
export class PostRelatedComponent implements OnInit {
  isMobile = false;
  relatedPosts: PostSearchItem[] = [];

  private postId = '';
  private isChanged = false;
  private isLoaded = false;

  constructor(
    private readonly destroy$: DestroyService,
    private readonly userAgentService: UserAgentService,
    private readonly postService: PostService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngOnInit(): void {
    this.postService.activePostId$
      .pipe(
        skipWhile((postId) => !postId),
        takeUntil(this.destroy$)
      )
      .subscribe((postId) => {
        this.isChanged = this.postId !== postId;
        this.postId = postId;
        if (!this.isLoaded || this.isChanged) {
          this.getRelatedPosts();
          this.isLoaded = true;
        }
      });
  }

  private getRelatedPosts(): void {
    this.postService
      .getRelatedPosts({
        postId: this.postId,
        page: 1,
        size: 4
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.relatedPosts = res;
      });
  }
}
