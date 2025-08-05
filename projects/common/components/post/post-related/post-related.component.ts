import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DestroyService, UserAgentService } from 'common/core';
import { PostSearchItem } from 'common/interfaces';
import { PostService } from 'common/services';
import { skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'lib-post-related',
  imports: [RouterLink],
  providers: [DestroyService],
  templateUrl: './post-related.component.html'
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
