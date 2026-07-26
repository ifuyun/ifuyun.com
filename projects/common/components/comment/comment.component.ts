import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, DOCUMENT, inject, input, OnInit, signal } from '@angular/core';
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
  private readonly document = inject(DOCUMENT);
  private readonly destroy$ = inject(DestroyService);
  private readonly fb = inject(FormBuilder);
  private readonly uaService = inject(UserAgentService);
  private readonly commonService = inject(CommonService);
  private readonly message = inject(MessageService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);
  private readonly userService = inject(UserService);
  private readonly commentService = inject(CommentService);
  private readonly voteService = inject(VoteService);

  readonly targetType = input<CommentTargetType>(CommentTargetType.POST);

  readonly maxContentLength = 400;
  readonly isMobile = this.uaService.isMobile;
  readonly isSignIn = signal(false);
  readonly page = signal(1);
  readonly comments = signal<Comment[]>([]);
  readonly commentForm = computed(() => this.fb.group(this.commentFormConfig));
  readonly replyForm = computed(() => this.fb.group(this.commentFormConfig));
  readonly replyMode = signal(false);
  readonly replyVisibleMap = signal<Record<string, boolean>>({});
  readonly voteLoadingMap = signal<Record<string, boolean>>({});
  readonly saveLoading = signal(false);

  private readonly pageSize = 50;
  private readonly appInfo = signal<TenantAppVo | null>(null);
  private readonly options = signal<OptionEntity>({});
  private readonly targetId = signal('');
  private readonly commentParentId = signal('');
  private readonly commentTopId = signal('');
  private readonly commentFormConfig = {
    content: ['', [Validators.required, Validators.maxLength(this.maxContentLength)]],
    aiComment: [false, []]
  };
  private readonly avatarType = computed(() => {
    const avatarType = this.options()['avatar_default_type'];
    if (!avatarType || avatarType === 'logo') {
      return this.appInfo()?.faviconUrl || '';
    }
    return avatarType;
  });
  private readonly threadDepth = computed(() => {
    return this.isMobile ? 2 : Number(this.options()['comment_thread_depth']) || 3;
  });

  ngOnInit(): void {
    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        this.appInfo.set(appInfo);
        this.options.set(options);
      });
    this.commentService.targetId$.pipe(takeUntil(this.destroy$)).subscribe((targetId) => {
      this.targetId.set(targetId);

      this.resetCommentForm(this.commentForm());
      this.resetReplyStatus();
      if (this.targetId()) {
        this.getComments();
      }
    });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.isSignIn.set(!!user.id);
    });
  }

  saveComment(form: FormGroup) {
    if (!this.isSignIn()) {
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
    this.saveLoading.set(true);
    this.commentService
      .saveComment({
        targetId: this.targetId(),
        targetType: this.targetType(),
        parentId: this.commentParentId(),
        topId: this.commentTopId(),
        content: value.content
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.saveLoading.set(false);
        if (res.code === ResponseCode.SUCCESS) {
          this.resetCommentForm(form);
          this.cancelReply();

          if (res.data.status === 'success') {
            this.message.success('评论成功');
            this.getComments();
          } else {
            this.message.success('评论成功，审核通过后将显示在页面上');
          }
        }
      });
  }

  vote(comment: CommentModel, like: boolean) {
    if (!this.isSignIn()) {
      this.showSigninModal();
      return;
    }
    if (this.voteLoadingMap()[comment.id]) {
      return;
    }
    if (comment.liked || comment.disliked) {
      return;
    }
    this.voteLoadingMap.update((data) => {
      return {
        ...data,
        [comment.id]: true
      };
    });
    this.voteService
      .saveVote({
        targetId: comment.id,
        value: like ? VoteValue.LIKE : VoteValue.DISLIKE,
        type: VoteType.COMMENT
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.voteLoadingMap.update((data) => {
          return {
            ...data,
            [comment.id]: false
          };
        });

        if (res.code === ResponseCode.SUCCESS) {
          comment.likes = res.data.likeCount;
          comment.dislikes = res.data.dislikeCount;
          comment.liked = like;
          comment.disliked = !like;
        }
      });
  }

  reply(comment: CommentModel) {
    this.resetReplyVisible();
    this.resetCommentForm(this.replyForm());

    this.commentParentId.set(comment.id);
    this.commentTopId.set(comment.topId || '');
    this.replyVisibleMap.update((data) => {
      return {
        ...data,
        [comment.id]: true
      };
    });
    this.replyMode.set(true);
  }

  cancelReply() {
    this.resetReplyVisible();
    this.commentParentId.set('');
    this.commentTopId.set('');
    this.replyMode.set(false);
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
    this.commonService.updateSigninOptions({
      visible: true,
      closable: true
    });
  }

  private getComments(scroll = false) {
    this.commentService
      .getCommentsByTargetId({
        targetId: this.targetId(),
        targetType: this.targetType(),
        page: this.page(),
        size: this.pageSize
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.comments.set(
          this.commentService.buildCommentTree({
            comments: res.list || [],
            depth: this.threadDepth(),
            avatarType: this.avatarType()
          })
        );

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
    this.replyMode.set(false);
  }

  private resetReplyVisible() {
    this.replyVisibleMap.set({});
  }
}
