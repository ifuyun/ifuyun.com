import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, DOCUMENT, Inject, Input, OnInit, signal } from '@angular/core';
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
import { CommentTargetType, VoteType, VoteValue } from 'common/enums';
import { IconChatSquareComponent } from 'common/icons';
import { Comment, CommentModel, TenantAppVo } from 'common/interfaces';
import { SafeHtmlPipe } from 'common/pipes';
import {
  CommentService,
  CommonService,
  OptionService,
  TenantAppService,
  UserService,
  VoteService
} from 'common/services';
import { isEmpty } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';

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
    IconChatSquareComponent,
    IconChatSquareComponent
  ],
  providers: [DestroyService],
  templateUrl: './comment.component.html',
  styleUrl: './comment.component.less'
})
export class CommentComponent extends BaseComponent implements OnInit {
  @Input() targetType: CommentTargetType = CommentTargetType.POST;
  @Input() enableAI = false;

  readonly maxContentLength = 400;

  isMobile = false;
  isSignIn = false;
  readonly page = signal(1);
  readonly pageSize = signal(50);
  comments: Comment[] = [];
  commentForm!: FormGroup;
  replyForm!: FormGroup;
  replyMode = false;
  replyVisibleMap: Record<string, boolean> = {};
  commentVoteLoading: Record<string, boolean> = {};
  saveLoading = false;

  private appInfo!: TenantAppVo;
  private options: OptionEntity = {};
  private targetId = '';
  private commentParentId = '';
  private commentTopId?: string = '';
  private commentFormConfig = {
    content: ['', [Validators.required, Validators.maxLength(this.maxContentLength)]],
    aiComment: [false, []]
  };

  private get avatarType() {
    const avatarType = this.options['avatar_default_type'];
    if (!avatarType || avatarType === 'logo') {
      return this.appInfo.faviconUrl;
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
    private readonly commonService: CommonService,
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
    this.commentService.targetId$.pipe(takeUntil(this.destroy$)).subscribe((targetId) => {
      this.targetId = targetId;

      this.resetCommentForm(this.commentForm);
      this.resetReplyStatus();
      if (this.targetId) {
        this.getComments();
      }
    });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.isSignIn = !!user.id;
    });
  }

  saveComment(form: FormGroup) {
    if (!this.isSignIn) {
      this.showSigninModal();
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
        targetId: this.targetId,
        targetType: this.targetType,
        parentId: this.commentParentId,
        topId: this.commentTopId,
        content: value.content
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
      this.showSigninModal();
      return;
    }
    if (this.commentVoteLoading[comment.id]) {
      return;
    }
    if (comment.liked || comment.disliked) {
      return;
    }
    this.commentVoteLoading[comment.id] = true;
    this.voteService
      .saveVote({
        targetId: comment.id,
        value: like ? VoteValue.LIKE : VoteValue.DISLIKE,
        type: VoteType.COMMENT
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.commentVoteLoading[comment.id] = false;

        if (res.code === ResponseCode.SUCCESS) {
          comment.likes = res.data.likes;
          comment.dislikes = res.data.dislikes;
          comment.liked = like;
          comment.disliked = !like;
        }
      });
  }

  reply(comment: CommentModel) {
    this.resetReplyVisible();
    this.resetCommentForm(this.replyForm);

    this.commentParentId = comment.id;
    this.commentTopId = comment.topId;
    this.replyVisibleMap[comment.id] = true;
    this.replyMode = true;
  }

  cancelReply() {
    this.resetReplyVisible();
    this.commentParentId = '';
    this.commentTopId = '';
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

  showSigninModal() {
    this.commonService.updateSigninModalVisible({
      visible: true,
      closable: true
    });
  }

  private getComments(scroll = false) {
    this.commentService
      .getCommentsByTargetId({
        targetId: this.targetId,
        targetType: this.targetType,
        page: this.page(),
        size: this.pageSize()
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.comments = this.commentService.buildCommentTree(res.list || [], this.threadDepth, this.avatarType);

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
