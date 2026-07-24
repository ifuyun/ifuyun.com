import { Component, inject, OnInit, signal } from '@angular/core';
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
  private readonly destroy$ = inject(DestroyService);
  private readonly uaService = inject(UserAgentService);
  private readonly postService = inject(PostService);

  readonly isMobile = this.uaService.isMobile;
  readonly isChanged = signal(false);
  readonly prevPost = signal<PostModel | null>(null);
  readonly nextPost = signal<PostModel | null>(null);

  private readonly postId = signal('');
  private readonly isLoaded = signal(false);

  ngOnInit(): void {
    this.postService.activePostId$
      .pipe(
        skipWhile((postId) => !postId),
        takeUntil(this.destroy$)
      )
      .subscribe((postId) => {
        this.isChanged.set(this.postId() !== postId);
        this.postId.set(postId);

        if (!this.isLoaded() || this.isChanged()) {
          this.getPostsOfPrevAndNext();
          this.isLoaded.set(true);
        }
      });
  }

  private getPostsOfPrevAndNext(): void {
    this.postService
      .getPostsOfPrevAndNext({
        id: this.postId(),
        contentType: ContentType.POST
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.prevPost.set(res.prevPost);
        this.nextPost.set(res.nextPost);
      });
  }
}
