import { ViewportScroller } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommentDto, CommentEntity } from '../../interfaces/comments';
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
  private loginUser: LoginUserEntity = {};

  prevPost: PostEntity | null = null;
  nextPost: PostEntity | null = null;
  comments: CommentEntity[] = [];
  post: PostModel | null = null;
  postMeta: Record<string, string> = {};
  postTags: TaxonomyEntity[] = [];
  postCategories: TaxonomyEntity[] = [];
  crumbs: CrumbEntity[] = [];
  showCrumb: boolean = true;

  @ViewChild('captchaImg') captchaImg!: ElementRef;

  commentForm = this.fb.group({
    author: ['', [Validators.required, Validators.maxLength(8)]],
    email: ['', [Validators.required, Validators.maxLength(100), Validators.email]],
    captcha: ['', [Validators.required, Validators.maxLength(4)]],
    content: ['', [Validators.required, Validators.maxLength(400)]]
  });

  constructor(
    private router: ActivatedRoute,
    private postsService: PostsService,
    private commentsService: CommentsService,
    private usersService: UsersService,
    private fb: FormBuilder,
    private message: NzMessageService,
    private scroller: ViewportScroller
  ) {
  }

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
    this.fetchComments();
    this.usersService.getLoginUser().subscribe((user) => {
      this.loginUser = user;
      this.commentForm.get('author')?.setValue(user.userName);
      this.commentForm.get('email')?.setValue(user.userEmail);
    });
  }

  private fetchComments(cb?: Function) {
    this.commentsService.getCommentsByPostId(this.postId).subscribe((comments) => {
      this.comments = comments;
      cb && cb();
    });
  }

  private resetCommentForm() {
    this.commentForm.markAsUntouched();
    this.commentForm.markAsPristine();
    this.commentForm.get('captcha')?.setValue('');
    this.commentForm.get('content')?.setValue('');
  }

  saveComment() {
    if (!this.commentForm.valid) {
      const formLabels: Record<string, string> = {
        author: '昵称',
        email: 'Email',
        captcha: '验证码',
        content: '评论内容'
      };
      const msgs: string[] = [];
      Object.keys(this.commentForm.controls).forEach((key) => {
        const ctrl = this.commentForm.get(key);
        const errors = ctrl?.errors;
        errors && ctrl?.markAsTouched({ onlySelf: true });
        errors && Object.keys(errors).forEach((type) => {
          switch (type) {
            case 'required':
              msgs.push(`请输入${formLabels[key]}`);
              break;
            case 'maxlength':
              msgs.push(`${formLabels[key]}长度应不大于${errors[type].requiredLength}字符，当前为${errors[type].actualLength}`);
              break;
          }
        });
      });
      msgs.forEach((msg) => this.message.error(msg));
    } else {
      const { author, email, captcha, content } = this.commentForm.value;
      const commentDto: CommentDto = {
        postId: this.postId,
        captchaCode: captcha,
        commentContent: content,
        commentAuthor: author,
        commentAuthorEmail: email
      };
      this.commentsService.saveComment(commentDto).subscribe((res) => {
        if (res.code === 0) {
          this.message.success('评论成功');
          this.resetCommentForm();
          this.captchaImg.nativeElement.src = `${this.captchaImg.nativeElement.src}?r=${Math.random()}`;
          this.fetchComments(() => {
            this.scroller.scrollToAnchor('comments');
          });
        }
      });
    }
  }
}
