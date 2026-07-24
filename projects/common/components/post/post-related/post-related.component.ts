import { Component, inject, OnInit, signal } from '@angular/core';
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
  private readonly destroy$ = inject(DestroyService);
  private readonly uaService = inject(UserAgentService);
  private readonly postService = inject(PostService);

  readonly isMobile = this.uaService.isMobile;
  readonly relatedPosts = signal<PostSearchItem[]>([]);

  private readonly postId = signal('');
  private readonly isChanged = signal(false);
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
          this.getRelatedPosts();
          this.isLoaded.set(true);
        }
      });
  }

  private getRelatedPosts(): void {
    this.postService
      .getRelatedPosts(this.postId())
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.relatedPosts.set(res);
      });
  }
}
