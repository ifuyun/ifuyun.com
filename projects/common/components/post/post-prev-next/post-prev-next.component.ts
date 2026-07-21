import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DestroyService, UserAgentService } from 'common/core';
import { ContentType } from 'common/enums';
import { PostModel } from 'common/interfaces';
import { PostService } from 'common/services';
import { skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'lib-post-prev-next',
  imports: [RouterLink],
  providers: [DestroyService],
  templateUrl: './post-prev-next.component.html'
})
export class PostPrevNextComponent implements OnInit {
  isMobile = false;
  isChanged = false;
  prevPost?: PostModel;
  nextPost?: PostModel;

  private postId = '';
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
          this.getPostsOfPrevAndNext();
          this.isLoaded = true;
        }
      });
  }

  private getPostsOfPrevAndNext(): void {
    this.postService
      .getPostsOfPrevAndNext({
        id: this.postId,
        contentType: ContentType.POST
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.prevPost = res.prevPost;
        this.nextPost = res.nextPost;
      });
  }
}
