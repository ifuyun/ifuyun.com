import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { skipWhile, takeUntil } from 'rxjs';
import { PostType } from '../../enums/post';
import { PostEntity } from '../../interfaces/post';
import { DestroyService } from '../../services/destroy.service';
import { PostService } from '../../services/post.service';
import { UserAgentService } from '../../services/user-agent.service';

@Component({
  selector: 'app-post-prev-next',
  imports: [RouterLink],
  providers: [DestroyService],
  templateUrl: './post-prev-next.component.html'
})
export class PostPrevNextComponent implements OnInit {
  isMobile = false;
  isChanged = false;
  prevPost?: PostEntity;
  nextPost?: PostEntity;

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
        postId: this.postId,
        postType: PostType.POST
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.prevPost = res.prevPost;
        this.nextPost = res.nextPost;
      });
  }
}
