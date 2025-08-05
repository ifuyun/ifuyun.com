import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, DOCUMENT, Inject, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  BaseComponent,
  DestroyService,
  MessageService,
  OptionEntity,
  ResponseCode,
  UserAgentService
} from 'common/core';
import { CommentObjectType, VoteType, VoteValue } from 'common/enums';
import { Comment, CommentModel, TenantAppModel } from 'common/interfaces';
import { SafeHtmlPipe } from 'common/pipes';
import { CommentService, OptionService, TenantAppService, UserService, VoteService } from 'common/services';
import { isEmpty } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { LoginModalComponent } from '../login-modal/login-modal.component';

@Component({
  selector: 'lib-comment',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    SafeHtmlPipe,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCheckboxModule,
    NzIconModule,
    LoginModalComponent
  ],
  providers: [DestroyService],
  templateUrl: './comment.component.html',
  styleUrl: './comment.component.less'
})
export class CommentComponent extends BaseComponent implements OnInit {
  @Input() objectType: CommentObjectType = CommentObjectType.POST;
  @Input() enableAI = false;

  readonly maxContentLength = 400;

  isMobile = false;
  isSignIn = false;
  comments: Comment[] = [];
  commentForm!: FormGroup;
  replyForm!: FormGroup;
  replyMode = false;
  replyVisibleMap: Record<string, boolean> = {};
  commentVoteLoading: Record<string, boolean> = {};
  saveLoading = false;
  loginVisible = false;

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private objectId = '';
  private commentParentId = '';
  private commentTopId?: string = '';
  private commentFormConfig = {
    content: ['', [Validators.required, Validators.maxLength(this.maxContentLength)]],
    aiComment: [false, []]
  };

  private get avatarType() {
    const avatarType = this.options['avatar_default_type'];
    if (!avatarType || avatarType === 'logo') {
      return this.appInfo.appFaviconUrl;
    }
    return avatarType;
  }

  private get threadDepth() {
    return this.isMobile ? 2 : Number(this.options['comment_thread_depth']) || 3;
  }

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly destroy$: DestroyService,
    private readonly fb: FormBuilder,
    private readonly userAgentService: UserAgentService,
    private readonly message: MessageService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly userService: UserService,
    private readonly commentService: CommentService,
    private readonly voteService: VoteService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile;
    this.commentForm = fb.group(this.commentFormConfig);
    this.replyForm = fb.group(this.commentFormConfig);
  }

  ngOnInit(): void {
    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        this.appInfo = appInfo;
        this.options = options;
      });
    this.commentService.objectId$.pipe(takeUntil(this.destroy$)).subscribe((objectId) => {
      this.objectId = objectId;

      this.resetCommentForm(this.commentForm);
      this.resetReplyStatus();
      if (this.objectId) {
        this.getComments();
      }
    });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.isSignIn = !!user.userId;
    });
  }

  saveComment(form: FormGroup) {
    if (!this.isSignIn) {
      this.showLoginModal();
      return;
    }
    const { value, valid } = this.validateForm(form);
    if (!valid) {
      return;
    }
    if (!valid) {
      return;
    }
    this.saveLoading = true;
    this.commentService
      .saveComment({
        objectId: this.objectId,
        objectType: this.objectType,
        commentParent: this.commentParentId,
        commentTop: this.commentTopId,
        commentContent: value.content
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.saveLoading = false;
        if (res.code === ResponseCode.SUCCESS) {
          this.replyMode = false;
          this.resetCommentForm(form);
          this.resetReplyVisible();

          if (res.data.status === 'success') {
            this.message.success('评论成功');
            this.getComments(true);
          } else {
            this.message.success('评论成功，审核通过后将显示在页面上');
          }
        }
      });
  }

  vote(comment: CommentModel, like: boolean) {
    if (!this.isSignIn) {
      this.showLoginModal();
      return;
    }
    if (this.commentVoteLoading[comment.commentId]) {
      return;
    }
    if (comment.liked || comment.disliked) {
      return;
    }
    this.commentVoteLoading[comment.commentId] = true;
    this.voteService
      .saveVote({
        objectId: comment.commentId,
        value: like ? VoteValue.LIKE : VoteValue.DISLIKE,
        type: VoteType.COMMENT
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.commentVoteLoading[comment.commentId] = false;

        if (res.code === ResponseCode.SUCCESS) {
          comment.commentLikes = res.data.likes;
          comment.commentDislikes = res.data.dislikes;
          comment.liked = like;
          comment.disliked = !like;
        }
      });
  }

  reply(comment: CommentModel) {
    this.resetReplyVisible();
    this.resetCommentForm(this.replyForm);

    this.commentParentId = comment.commentId;
    this.commentTopId = comment.commentTop;
    this.replyVisibleMap[comment.commentId] = true;
    this.replyMode = true;
  }

  cancelReply() {
    this.resetReplyVisible();
    this.replyMode = false;
  }

  scrollToComment(e: MouseEvent) {
    const hash = (e.target as HTMLElement).dataset['hash'] || '';
    const offsetTop = this.document.getElementById(hash)?.offsetTop || 0;

    if (offsetTop > 0) {
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  }

  showLoginModal() {
    this.loginVisible = true;
  }

  closeLoginModal() {
    this.loginVisible = false;
  }

  private getComments(scroll = false) {
    this.commentService
      .getCommentsByObjectId(this.objectId, this.objectType)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.comments = this.commentService.transformComments(res.list || [], this.threadDepth, this.avatarType);

        if (scroll) {
          this.scrollToComments();
        }
      });
  }

  private scrollToComments() {
    const offsetTop = this.document.getElementById('comments')?.offsetTop || 0;

    if (offsetTop > 0) {
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  }

  private resetCommentForm = (form: FormGroup) => {
    form.markAsUntouched();
    form.markAsPristine();
    form.patchValue({
      content: '',
      aiComment: false
    });
  };

  private resetReplyStatus() {
    this.resetReplyVisible();
    this.replyMode = false;
  }

  private resetReplyVisible() {
    this.replyVisibleMap = {};
  }
}
