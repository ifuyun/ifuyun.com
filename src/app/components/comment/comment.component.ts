import { CommonModule, DatePipe, DOCUMENT, ViewportScroller } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { cloneDeep, isEmpty, uniq } from 'lodash';
import { skipWhile, takeUntil } from 'rxjs';
import { ApiUrl } from '../../config/api-url';
import {
  URL_AVATAR_API,
  PATH_FAVICON,
  STORAGE_KEY_DISLIKED_COMMENTS,
  STORAGE_KEY_LIKED_COMMENTS
} from '../../config/common.constant';
import { VoteType, VoteValue } from '../../config/common.enum';
import { ResponseCode } from '../../config/response-code.enum';
import { CommonService } from '../../core/common.service';
import { DestroyService } from '../../core/destroy.service';
import { PlatformService } from '../../core/platform.service';
import { UserAgentService } from '../../core/user-agent.service';
import { format } from '../../helpers/helper';
import { OptionEntity } from '../../interfaces/option.interface';
import { Guest, UserModel } from '../../interfaces/user.interface';
import { VoteEntity } from '../../interfaces/vote.interface';
import { CommentHashPipe } from '../../pipes/comment-hash.pipe';
import { OptionService } from '../../services/option.service';
import { UserService } from '../../services/user.service';
import { VoteService } from '../../services/vote.service';
import { MessageService } from '../message/message.service';
import { CommentObjectType } from './comment.enum';
import { Comment, CommentEntity, CommentModel } from './comment.interface';
import { CommentService } from './comment.service';

@Component({
  selector: 'i-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.less'],
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, DatePipe, CommentHashPipe],
  providers: [DestroyService]
})
export class CommentComponent implements OnInit, AfterViewInit {
  @Input() objectType: CommentObjectType = CommentObjectType.POST;

  @ViewChild('captchaImg') captchaImg!: ElementRef;

  isMobile = false;
  isLoggedIn = false;
  objectId = '';
  user!: UserModel;
  captchaUrl = '';
  comments: Comment[] = [];
  replyMode = false;
  replyVisibleMap: Record<string, boolean> = {};
  commentVoteLoading: Record<string, boolean> = {};
  saveLoading = false;

  private options: OptionEntity = {};
  private commentFormConfig = {
    author: ['', [Validators.required, Validators.maxLength(10)]],
    email: ['', [Validators.required, Validators.maxLength(100), Validators.email]],
    captcha: ['', [Validators.required, Validators.maxLength(4)]],
    content: ['', [Validators.required, Validators.maxLength(400)]],
    commentParent: [],
    commentTop: []
  };
  private commentUser: Guest | null = null;
  private readonly headerHeight!: number;

  commentForm = this.fb.group(this.commentFormConfig);
  replyForm = this.fb.group(this.commentFormConfig);

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private destroy$: DestroyService,
    private platform: PlatformService,
    private userAgentService: UserAgentService,
    private fb: FormBuilder,
    private commonService: CommonService,
    private optionService: OptionService,
    private userService: UserService,
    private commentService: CommentService,
    private voteService: VoteService,
    private message: MessageService,
    private scroller: ViewportScroller
  ) {
    this.isMobile = this.userAgentService.isMobile();
    this.headerHeight = this.isMobile ? 56 : 60;
  }

  ngOnInit(): void {
    this.initOptions();
    this.commentService.objectId$.pipe(takeUntil(this.destroy$)).subscribe((objectId) => {
      this.objectId = objectId;
      this.resetCommentForm(this.commentForm);
      this.resetReplyStatus();
      if (this.objectId) {
        this.fetchComments();
      }
    });
    this.userService.loginUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user = user;
      this.isLoggedIn = !!this.user.userId;
      if (this.isLoggedIn) {
        this.commentForm.setControl('author', new FormControl());
        this.commentForm.setControl('email', new FormControl());
        this.commentForm.setControl('captcha', new FormControl());
        this.replyForm.setControl('author', new FormControl());
        this.replyForm.setControl('email', new FormControl());
        this.replyForm.setControl('captcha', new FormControl());
      }
    });
  }

  ngAfterViewInit() {
    if (this.platform.isBrowser) {
      const commentUser = this.userService.getCommentUser();
      if (commentUser) {
        this.commentUser = { ...commentUser };
        !this.isLoggedIn && setTimeout(() => this.initCommentForm(), 0);
      }
    }
  }

  saveComment(form: FormGroup) {
    if (!form.valid) {
      const formLabels: Record<string, string> = {
        author: '昵称',
        email: '邮箱',
        captcha: '验证码',
        content: '评论内容'
      };
      const msgs: string[] = [];
      Object.keys(form.controls).forEach((key) => {
        const ctrl = form.get(key);
        const errors = ctrl?.errors;
        if (errors) {
          ctrl?.markAsTouched({ onlySelf: true });
          Object.keys(errors).forEach((type) => {
            switch (type) {
              case 'required':
                msgs.push(`请输入${formLabels[key]}`);
                break;
              case 'maxlength':
                msgs.push(
                  `${formLabels[key]}长度应不大于${errors[type].requiredLength}字符，当前为${errors[type].actualLength}`
                );
                break;
            }
          });
        }
      });
      msgs.length > 0 && this.message.error(msgs[0]);
    } else {
      const { author, email, captcha, content, commentParent, commentTop } = form.value;
      const commentDto: CommentEntity = {
        objectId: this.objectId,
        objectType: this.objectType,
        commentParent: commentParent || '',
        commentTop: commentTop || '',
        captchaCode: captcha,
        commentContent: content,
        authorName: author,
        authorEmail: email,
        userId: this.user.userId
      };
      this.saveLoading = true;
      this.commentService
        .saveComment(commentDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          this.saveLoading = false;
          if (res.code === ResponseCode.SUCCESS) {
            const msg = res.data.status === 'success' ? '评论成功' : '评论成功，审核通过后将显示在页面上';
            this.message.success(msg);
            const cachedReplyMode = this.replyMode;
            this.replyMode = false;
            this.resetCommentForm(form);
            this.resetReplyVisible();
            this.refreshCaptcha();
            this.fetchComments(() => {
              if (!cachedReplyMode) {
                const offsetTop = this.document.getElementById('comments')?.offsetTop || 0;
                if (offsetTop > 0) {
                  this.scroller.scrollToPosition([0, offsetTop - this.headerHeight]);
                }
              }
            });
          }
        });
    }
  }

  voteComment(comment: CommentModel, like: boolean) {
    const likedComments = (localStorage.getItem(STORAGE_KEY_LIKED_COMMENTS) || '').split(',');
    const dislikedComments = (localStorage.getItem(STORAGE_KEY_DISLIKED_COMMENTS) || '').split(',');
    const votedComments = uniq(likedComments.concat(dislikedComments));
    if (votedComments.includes(comment.commentId) || this.commentVoteLoading[comment.commentId]) {
      return;
    }
    this.commentVoteLoading[comment.commentId] = true;
    const voteData: VoteEntity = {
      objectId: comment.commentId,
      value: like ? VoteValue.LIKE : VoteValue.DISLIKE,
      type: VoteType.COMMENT
    };
    if (this.commentUser && this.commentUser.name) {
      voteData.user = this.commentUser;
    }
    this.voteService
      .saveVote(voteData)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.commentVoteLoading[comment.commentId] = false;
        if (res.code === ResponseCode.SUCCESS) {
          comment.commentLikes = res.data.likes;
          comment.commentDislikes = res.data.dislikes;
          if (like) {
            comment.liked = true;
            likedComments.push(comment.commentId);
            localStorage.setItem(STORAGE_KEY_LIKED_COMMENTS, uniq(likedComments.filter((item) => !!item)).join(','));
          } else {
            comment.disliked = true;
            dislikedComments.push(comment.commentId);
            localStorage.setItem(
              STORAGE_KEY_DISLIKED_COMMENTS,
              uniq(dislikedComments.filter((item) => !!item)).join(',')
            );
          }
        }
      });
  }

  replyComment(comment: CommentModel, form: FormGroup) {
    this.resetReplyVisible();
    this.replyVisibleMap[comment.commentId] = true;
    this.replyMode = true;
    this.resetCommentForm(form);
    form.get('commentParent')?.setValue(comment.commentId);
    form.get('commentTop')?.setValue(comment.commentTop);
    this.refreshCaptcha();
  }

  cancelReply() {
    this.resetReplyVisible();
    this.refreshCaptcha();
    this.replyMode = false;
  }

  refreshCaptcha(e?: MouseEvent) {
    if (!this.isLoggedIn) {
      const captchaUrl = this.captchaUrl.split('?')[0];
      if (e) {
        (e.target as HTMLImageElement).src = `${captchaUrl}?r=${Math.random()}`;
      } else {
        setTimeout(() => (this.captchaImg.nativeElement.src = `${captchaUrl}?r=${Math.random()}`));
      }
    }
  }

  scrollToComment(e: MouseEvent) {
    const hash = (e.target as HTMLElement).dataset['hash'] || '';
    const offsetTop = this.document.getElementById(hash)?.offsetTop || 0;
    if (offsetTop > 0) {
      this.scroller.scrollToPosition([0, offsetTop - this.headerHeight]);
    }
  }

  private initOptions() {
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => {
        this.options = options;
        if (this.options['site_url'] && this.platform.isBrowser) {
          this.captchaUrl = `${this.options['site_url']}${ApiUrl.API_URL_PREFIX}${ApiUrl.CAPTCHA}?r=${Math.random()}`;
        }
      });
  }

  private initComment(comment: Comment) {
    const initialFn = (data: Comment) => {
      let defaultAvatar = this.options['avatar_default'];
      if (!defaultAvatar || defaultAvatar === 'logo') {
        defaultAvatar = PATH_FAVICON;
      }
      data.authorAvatar =
        data.user?.userAvatar ||
        format(URL_AVATAR_API, data.user?.userEmailHash || data.authorEmailHash, defaultAvatar);
      data.commentMetaMap = this.commonService.transformMeta(data.commentMeta || []);
      try {
        data.userLocation = JSON.parse(data.commentMetaMap['user_location']);
      } catch (e) {
        data.userLocation = {};
      }
    };
    initialFn(comment);
    comment.children.forEach((item) => initialFn(item));
  }

  private initCommentStatus(comments: Comment[]) {
    if (this.platform.isBrowser) {
      const likedComments = (localStorage.getItem(STORAGE_KEY_LIKED_COMMENTS) || '').split(',');
      const dislikedComments = (localStorage.getItem(STORAGE_KEY_DISLIKED_COMMENTS) || '').split(',');
      comments.forEach((item) => {
        likedComments.includes(item.commentId) && (item.liked = true);
        dislikedComments.includes(item.commentId) && (item.disliked = true);
      });
    }
  }

  private initCommentForm() {
    this.commentForm.get('author')?.setValue(this.commentUser?.name || '');
    this.commentForm.get('email')?.setValue(this.commentUser?.email || '');
    this.replyForm.get('author')?.setValue(this.commentUser?.name || '');
    this.replyForm.get('email')?.setValue(this.commentUser?.email || '');
  }

  private fetchComments(cb?: () => void) {
    this.commentService
      .getCommentsByObjectId(this.objectId, this.objectType)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.comments = res.list || [];
        this.comments.forEach((item) => {
          this.initComment(item);
          this.initCommentStatus(item.children);
          item.children = this.generateCommentTree(item.children);
          item.children.forEach((child) => (child.parent = cloneDeep(item)));
        });
        this.initCommentStatus(this.comments);
        cb && cb();
      });
  }

  private generateCommentTree(comments: Comment[]) {
    const depth = this.isMobile ? 2 : Number(this.options['thread_comments_depth']) || 3;
    const copies = [...comments];
    let tree = copies.filter((father) => {
      father.children = copies.filter((child) => {
        if (father.commentId === child.commentParent) {
          child.parent = father;
          return true;
        }
        return false;
      });
      father.isLeaf = father.children.length < 1;
      return father.commentParent === father.commentTop;
    });
    const flattenIterator = (nodes: Comment[], list: Comment[]) => {
      for (const node of nodes) {
        list.push({ ...node, isLeaf: true, level: depth, children: [] });
        if (node.children.length > 0) {
          flattenIterator(node.children, list);
        }
      }
      return list;
    };
    const iterator = (nodes: Comment[], level: number) => {
      if (depth === 2) {
        nodes = flattenIterator(nodes, []).sort((a, b) => (a.commentCreated > b.commentCreated ? 1 : -1));
      } else {
        nodes.forEach((node) => {
          node.level = level;
          if (node.children.length > 0) {
            if (level < depth - 1) {
              node.children = iterator(node.children, level + 1);
            } else {
              node.children = flattenIterator(node.children, []).sort((a, b) => {
                return a.commentCreated > b.commentCreated ? 1 : -1;
              });
            }
          }
        });
      }
      return nodes;
    };
    tree = iterator(tree, 2);

    return tree;
  }

  private resetCommentForm = (form: FormGroup) => {
    form.markAsUntouched();
    form.markAsPristine();
    form.get('captcha')?.setValue('');
    form.get('content')?.setValue('');
  };

  private resetReplyStatus() {
    this.resetReplyVisible();
    this.replyMode = false;
  }

  private resetReplyVisible() {
    this.replyVisibleMap = {};
  }
}
