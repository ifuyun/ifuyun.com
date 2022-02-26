import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommentEntity } from '../../interfaces/comments';
import { CrumbEntity } from '../../interfaces/crumb';
import { PostEntity, PostModel } from '../../interfaces/posts';
import { TaxonomyEntity } from '../../interfaces/taxonomies';
import { LoginUserEntity } from '../../interfaces/users';
import { CommentsService } from '../../services/comments.service';
import { PostsService } from '../../services/posts.service';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class PostComponent implements OnInit {
  private postId: string = '';
  prevPost: PostEntity | null = null;
  nextPost: PostEntity | null = null;
  comments: CommentEntity[] = [];
  loginUser: LoginUserEntity = {};
  post: PostModel | null = null;
  postMeta: Record<string, string> = {};
  postTags: TaxonomyEntity[] = [];
  postCategories: TaxonomyEntity[] = [];
  crumbs: CrumbEntity[] = [];
  showCrumb: boolean = true;

  constructor(
    private router: ActivatedRoute,
    private postsService: PostsService,
    private commentsService: CommentsService,
    private usersService: UsersService
  ) { }

  ngOnInit(): void {
    this.router.params.subscribe((params) => {
      this.postId = params['postId']?.trim();
    });
    this.postsService.getPostById(this.postId).subscribe((post) => {
      this.post = post.post;
      this.postMeta = post.meta;
      this.postTags = post.tags;
      this.postCategories = post.categories;
      this.crumbs = post.crumbs || [];
    });
    this.postsService.getPostsOfPrevAndNext(this.postId).subscribe((res) => {
      this.prevPost = res.prevPost;
      this.nextPost = res.nextPost;
    });
    this.commentsService.getCommentsByPostId(this.postId).subscribe((comments) => {
      this.comments = comments;
    });
    this.usersService.getLoginUser().subscribe((user) => {
      this.loginUser = user;
    });
  }
}
