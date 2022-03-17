import { ViewportScroller } from '@angular/common';
import { Component, ElementRef, Inject, OnDestroy, OnInit, Optional, PLATFORM_ID, Renderer2, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RESPONSE } from '@nguniversal/express-engine/tokens';
import { Response } from 'express';
import { HighlightJS } from 'ngx-highlightjs';
import * as QRCode from 'qrcode';
import { Subscription } from 'rxjs';
import { CrumbService } from '../../components/crumb/crumb.service';
import { MessageService } from '../../components/message/message.service';
import { POST_DESCRIPTION_LENGTH } from '../../config/constants';
import { BasePageComponent } from '../../core/base-page.component';
import { CommonService } from '../../core/common.service';
import { VoteType } from '../../enums/common.enum';
import { cutStr, filterHtmlTag } from '../../helpers/helper';
import { CommentDto, CommentEntity } from '../../interfaces/comments';
import { CrumbEntity } from '../../components/crumb/crumb.interface';
import { OptionEntity } from '../../interfaces/options';
import { PostEntity, PostModel } from '../../interfaces/posts';
import { TaxonomyEntity } from '../../interfaces/taxonomies';
import { LoginUserEntity } from '../../interfaces/users';
import { CommentsService } from '../../services/comments.service';
import { CustomMetaService } from '../../services/custom-meta.service';
import { OptionsService } from '../../services/options.service';
import { PostsService } from '../../services/posts.service';
import { UrlService } from '../../services/url.service';
import { UsersService } from '../../services/users.service';
import { VotesService } from '../../services/votes.service';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class PostComponent extends BasePageComponent implements OnInit, OnDestroy {
  pageIndex: string = '';
  prevPost: PostEntity | null = null;
  nextPost: PostEntity | null = null;
  comments: CommentEntity[] = [];
  post!: PostModel;
  postMeta: Record<string, string> = {};
  postTags: TaxonomyEntity[] = [];
  postCategories: TaxonomyEntity[] = [];
  crumbs: CrumbEntity[] = [];
  showCrumb: boolean = true;
  showQrcodeOfShare: boolean = false;
  showQrcodeOfReward: boolean = false;
  clickedImage!: HTMLImageElement;
  showImgModal: boolean = false;
  isStandalone: boolean = false;

  private postId: string = '';
  private postSlug: string = '';
  private loginUser: LoginUserEntity = {};
  private shareUrl: string = '';
  private options: OptionEntity = {};
  private unlistenClick!: Function;
  private listeners: Subscription[] = [];
  private referer: string = '';
  private urlListener!: Subscription;
  private paramListener!: Subscription;
  private userListener!: Subscription;

  @ViewChild('captchaImg') captchaImg!: ElementRef;
  @ViewChild('qrcodeCanvas') qrcodeCanvas!: ElementRef;
  @ViewChild('postContent', { static: false }) postContentEle!: ElementRef;

  commentForm = this.fb.group({
    author: ['', [Validators.required, Validators.maxLength(8)]],
    email: ['', [Validators.required, Validators.maxLength(100), Validators.email]],
    captcha: ['', [Validators.required, Validators.maxLength(4)]],
    content: ['', [Validators.required, Validators.maxLength(400)]],
    parentId: []
  });

  constructor(
    @Inject(PLATFORM_ID) protected platform: Object,
    @Optional() @Inject(RESPONSE) protected response: Response,
    private route: ActivatedRoute,
    private postsService: PostsService,
    private commonService: CommonService,
    private commentsService: CommentsService,
    private votesService: VotesService,
    private usersService: UsersService,
    private crumbService: CrumbService,
    private optionsService: OptionsService,
    private metaService: CustomMetaService,
    private urlService: UrlService,
    private fb: FormBuilder,
    private message: MessageService,
    private scroller: ViewportScroller,
    private renderer: Renderer2,
    private highlight: HighlightJS
  ) {
    super();
  }

  ngOnInit(): void {
    this.urlListener = this.urlService.urlInfo$.subscribe((url) => {
      this.referer = url.previous;
    });
    this.paramListener = this.route.params.subscribe((params) => {
      this.postId = params['postId']?.trim();
      this.postSlug = params['postSlug']?.trim();
      this.postSlug ? this.fetchPostStandalone() : this.fetchPost();
      this.scroller.scrollToAnchor('article');
    });
    this.userListener = this.usersService.getLoginUser().subscribe((user) => {
      this.loginUser = user;
      this.commentForm.get('author')?.setValue(user.userName);
      this.commentForm.get('email')?.setValue(user.userEmail);
    });
  }

  ngAfterViewInit() {
    const listener = this.highlight.highlightAll().subscribe(() => {
      const codeEles = this.postContentEle.nativeElement.querySelectorAll('pre code');
      codeEles.forEach((ele: HTMLElement) => {
        this.renderer.addClass(ele, 'code-lines');
        const lineListener = this.highlight.lineNumbersBlock(ele).subscribe();
        this.listeners.push(lineListener);
      });
    });
    this.listeners.push(listener);
    this.unlistenClick = this.renderer.listen(this.postContentEle.nativeElement, 'click', ((e: MouseEvent) => {
      if (e.target instanceof HTMLImageElement) {
        this.clickedImage = e.target;
        this.showImgModal = true;
      }
    }));
  }

  ngOnDestroy() {
    this.urlListener.unsubscribe();
    this.paramListener.unsubscribe();
    this.userListener.unsubscribe();
    this.listeners.forEach((listener) => listener.unsubscribe());
    this.unlistenClick();
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
      const { author, email, captcha, content, parentId } = this.commentForm.value;
      const commentDto: CommentDto = {
        postId: this.postId,
        parentId: parentId || '',
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

  toggleShareQrcode() {
    this.showQrcodeOfShare = !this.showQrcodeOfShare;
  }

  toggleRewardQrcode() {
    this.showQrcodeOfReward = !this.showQrcodeOfReward;
  }

  toggleImgModal(status: boolean) {
    this.showImgModal = status;
  }

  saveVote(comment: CommentEntity, isLike: boolean) {
    this.votesService.saveVote({
      objectId: comment.commentId,
      type: isLike ? VoteType.LIKE : VoteType.DISLIKE
    }).subscribe((res) => {
      comment.commentVote = res.vote;
    });
  }

  replyComment(comment: CommentEntity) {
    this.commentForm.get('parentId')?.setValue(comment.commentId);
    this.scroller.scrollToAnchor('respond');
  }

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.pageIndex);
  }

  private initMeta() {
    this.optionsService.options$.subscribe((options) => {
      this.options = options;
      this.metaService.updateHTMLMeta({
        title: `${this.post.postTitle} - ${options?.['site_name']}`,
        description: this.post.postExcerpt || cutStr(filterHtmlTag(this.post.postContent), POST_DESCRIPTION_LENGTH),
        author: options?.['site_author'],
        keywords: options?.['site_keywords']
      });
      this.initQrcode();
    });
  }

  private fetchPost() {
    this.postsService.getPostById(this.postId, this.referer).subscribe((post) => {
      if (post && post.post && post.post.postId) {
        this.post = post.post;
        this.postMeta = post.meta;
        this.postTags = post.tags;
        this.postCategories = post.categories;
        this.pageIndex = post.crumbs?.[0].slug || '';
        this.updateActivePage();
        this.crumbs = post.crumbs || [];
        this.crumbService.updateCrumb(this.crumbs);
        this.showCrumb = true;
        this.isStandalone = false;
        this.initMeta();
        this.fetchComments();
      }
    });
    this.postsService.getPostsOfPrevAndNext(this.postId).subscribe((res) => {
      this.prevPost = res.prevPost;
      this.nextPost = res.nextPost;
    });
  }

  private fetchPostStandalone() {
    this.postsService.getPostBySlug(this.postSlug).subscribe((post) => {
      if (post && post.post && post.post.postId) {
        this.post = post.post;
        this.postId = this.post?.postId;
        this.postMeta = post.meta;
        this.updateActivePage();
        this.showCrumb = false;
        this.isStandalone = true;
        this.initMeta();
        this.fetchComments();
      }
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

  private initQrcode() {
    const siteUrl = this.options?.['site_url'].replace(/\/$/i, '');
    const postGuid = this.post?.postGuid.replace(/^\//i, '');
    this.shareUrl = siteUrl + '/' + postGuid + '?ref=qrcode';
    QRCode.toCanvas(this.shareUrl, {
      width: 160,
      margin: 0
    }).then((canvas) => {
      this.qrcodeCanvas.nativeElement.appendChild(canvas);
    }).catch((err) => {
      this.message.error(err);
    });
  }
}
