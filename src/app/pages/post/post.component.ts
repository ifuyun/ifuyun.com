import { ViewportScroller } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import highlight from 'highlight.js';
import { uniq } from 'lodash';
import * as QRCode from 'qrcode';
import { Subscription } from 'rxjs';
import { BreadcrumbEntity } from '../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../components/breadcrumb/breadcrumb.service';
import { MessageService } from '../../components/message/message.service';
import { VoteType } from '../../config/common.enum';
import { POST_EXCERPT_LENGTH } from '../../config/constants';
import { CommonService } from '../../core/common.service';
import { PageComponent } from '../../core/page.component';
import { PlatformService } from '../../core/platform.service';
import { UserAgentService } from '../../core/user-agent.service';
import { cutStr, filterHtmlTag } from '../../helpers/helper';
import { CommentEntity, CommentModel } from '../../interfaces/comments';
import { OptionEntity } from '../../interfaces/options';
import { Post, PostEntity, PostModel } from '../../interfaces/posts';
import { TaxonomyEntity } from '../../interfaces/taxonomies';
import { LoginUserEntity } from '../../interfaces/users';
import { CommentsService } from '../../services/comments.service';
import { MetaService } from '../../core/meta.service';
import { OptionsService } from '../../services/options.service';
import { PostsService } from '../../services/posts.service';
import { UrlService } from '../../core/url.service';
import { UsersService } from '../../services/users.service';
import { VotesService } from '../../services/votes.service';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.less']
})
export class PostComponent extends PageComponent implements OnInit, OnDestroy, AfterViewInit {
  isMobile = false;
  pageIndex: string = '';
  prevPost: PostEntity | null = null;
  nextPost: PostEntity | null = null;
  comments: CommentModel[] = [];
  post!: PostModel;
  postMeta: Record<string, string> = {};
  postTags: TaxonomyEntity[] = [];
  postCategories: TaxonomyEntity[] = [];
  crumbs: BreadcrumbEntity[] = [];
  showCrumb: boolean = true;
  showShareQrcode: boolean = false;
  showRewardQrcode: boolean = false;
  clickedImage!: HTMLImageElement;
  showImgModal: boolean = false;
  isStandalone: boolean = false;

  private postId: string = '';
  private postSlug: string = '';
  private loginUser: LoginUserEntity = {};
  private shareUrl: string = '';
  private options: OptionEntity = {};
  private unlistenImgClick!: Function;
  private referer: string = '';
  private urlListener!: Subscription;
  private paramListener!: Subscription;
  private userListener!: Subscription;

  @ViewChild('captchaImg') captchaImg!: ElementRef;
  @ViewChild('qrcodeCanvas') qrcodeCanvas!: ElementRef;
  @ViewChild('postEle', { static: false }) postEle!: ElementRef;

  commentForm = this.fb.group({
    author: ['', [Validators.required, Validators.maxLength(8)]],
    email: ['', [Validators.required, Validators.maxLength(100), Validators.email]],
    captcha: ['', [Validators.required, Validators.maxLength(4)]],
    content: ['', [Validators.required, Validators.maxLength(400)]],
    commentParent: []
  });

  constructor(
    private postsService: PostsService,
    private commonService: CommonService,
    private commentsService: CommentsService,
    private votesService: VotesService,
    private usersService: UsersService,
    private crumbService: BreadcrumbService,
    private optionsService: OptionsService,
    private route: ActivatedRoute,
    private metaService: MetaService,
    private urlService: UrlService,
    private userAgentService: UserAgentService,
    private fb: FormBuilder,
    private message: MessageService,
    private platform: PlatformService,
    private scroller: ViewportScroller,
    private renderer: Renderer2
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
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
  }

  ngAfterViewInit() {
    if (this.platform.isBrowser) {
      this.userListener = this.usersService.getLoginUser().subscribe((user) => {
        this.loginUser = user;
        this.commentForm.get('author')?.setValue(user.userName);
        this.commentForm.get('email')?.setValue(user.userEmail);
      });
    }
    this.unlistenImgClick = this.renderer.listen(this.postEle.nativeElement, 'click', ((e: MouseEvent) => {
      if (e.target instanceof HTMLImageElement) {
        // todo: if image is in <a> link
        this.clickedImage = e.target;
        this.showImgModal = true;
      }
    }));
  }

  ngOnDestroy() {
    this.urlListener.unsubscribe();
    this.paramListener.unsubscribe();
    this.userListener?.unsubscribe();
    this.unlistenImgClick();
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
      msgs.length > 0 && this.message.error(msgs[0]);
    } else {
      const { author, email, captcha, content, commentParent } = this.commentForm.value;
      const commentDto: CommentEntity = {
        postId: this.postId,
        commentParent: commentParent || '',
        captchaCode: captcha,
        commentContent: content,
        commentAuthor: author,
        commentAuthorEmail: email
      };
      this.commentsService.saveComment(commentDto).subscribe((res) => {
        if (res.code === 0) {
          const msg = res.data.status === 'success' ? '评论成功' : '评论成功，审核通过后将显示在页面上';
          this.message.success(msg);
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
    this.showShareQrcode = !this.showShareQrcode;
  }

  toggleRewardQrcode() {
    this.showRewardQrcode = !this.showRewardQrcode;
  }

  toggleImgModal(status: boolean) {
    this.showImgModal = status;
  }

  saveVote(comment: CommentModel, like: boolean) {
    this.votesService.saveVote({
      objectId: comment.commentId,
      type: like ? VoteType.LIKE : VoteType.DISLIKE
    }).subscribe((res) => {
      comment.commentVote = res.vote;
    });
  }

  replyComment(comment: CommentModel) {
    this.commentForm.get('commentParent')?.setValue(comment.commentId);
    this.scroller.scrollToAnchor('respond');
  }

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.pageIndex);
  }

  private initMeta() {
    this.optionsService.options$.subscribe((options) => {
      this.options = options;
      const keywords: string[] = (options['site_keywords'] || '').split(',');
      this.metaService.updateHTMLMeta({
        title: `${this.post.postTitle} - ${options?.['site_name']}`,
        description: this.post.postExcerpt,
        author: options?.['site_author'],
        keywords: uniq(this.postTags.map((item) => item.taxonomyName).concat(keywords)).join(',')
      });
      !this.isStandalone && this.initQrcode();
    });
  }

  private fetchPost() {
    this.postsService.getPostById(this.postId, this.referer).subscribe((post) => {
      if (post && post.post && post.post.postId) {
        this.initData(post, false);
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
        this.initData(post, true);
      }
    });
  }

  private initData(post: Post, isStandalone: boolean) {
    this.post = post.post;
    this.post.postExcerpt = this.post.postExcerpt || cutStr(filterHtmlTag(this.post.postContent), POST_EXCERPT_LENGTH);
    this.postId = this.post?.postId;
    this.postMeta = post.meta;
    this.postTags = post.tags;
    this.postCategories = post.categories;
    this.pageIndex = (isStandalone ? post.post.postName : post.crumbs?.[0].slug) || '';
    this.updateActivePage();
    if (!isStandalone) {
      this.crumbs = post.crumbs || [];
      this.crumbService.updateCrumb(this.crumbs);
    }
    this.showCrumb = !isStandalone;
    this.isStandalone = isStandalone;
    this.initMeta();
    this.parseHtml();
    this.fetchComments();
  }

  private fetchComments(cb?: Function) {
    this.commentsService.getCommentsByPostId(this.postId).subscribe((comments) => {
      this.comments = comments.comments || [];
      cb && cb();
    });
  }

  private resetCommentForm() {
    this.commentForm.markAsUntouched();
    this.commentForm.markAsPristine();
    this.commentForm.get('captcha')?.setValue('');
    this.commentForm.get('content')?.setValue('');
  }

  private parseHtml() {
    this.post.postContent = this.post.postContent.replace(
      /<pre(?:\s+[^>]*)*>\s*<code(?:\s+[^>]*)?>([\s\S]*?)<\/code>\s*<\/pre>/ig,
      (preStr, codeStr: string) => {
        const langReg = /^<pre(?:\s+[^>]*)*\s+class="([^"]+)"(?:\s+[^>]*)*>/ig;
        const langResult = Array.from(preStr.matchAll(langReg));
        let langStr = '';
        let language = '';
        if (langResult.length > 0 && langResult[0].length === 2) {
          const langClass = langResult[0][1].split(/\s+/i).filter(
            (item) => item.split('-')[0].toLowerCase() === 'language'
          );
          if (langClass.length > 0) {
            langStr = langClass[0].split('-')[1] || '';
            if (langStr && highlight.getLanguage(langStr)) {
              language = langStr;
            }
          }
        }
        // unescape tag name & arrow function
        codeStr = codeStr.replace(/&lt;([\s\S]*?)&gt;/ig, '<$1>').replace(/=&gt;/ig, '=>');
        const lines = codeStr.split(/\r\n|\r|\n/i).map((str, i) => `<li>${i + 1}</li>`).join('');
        const codes = language
          ? highlight.highlight(codeStr, { language }).value
          : highlight.highlightAuto(codeStr).value;

        return `<pre class="i-code"${langStr ? ' data-lang="' + langStr + '"' : ''}>` +
          `<ul class="i-code-lines">${lines}</ul>` +
          `<code class="i-code-text">${codes}</code></pre>`;
      }
    );
  }

  private initQrcode() {
    const siteUrl = this.options?.['site_url'].replace(/\/$/i, '');
    const postGuid = this.post?.postGuid.replace(/^\//i, '');
    this.shareUrl = siteUrl + '/' + postGuid + '?ref=qrcode';
    QRCode.toCanvas(this.shareUrl, {
      width: 164,
      margin: 0
    }).then((canvas) => {
      this.qrcodeCanvas.nativeElement.appendChild(canvas);
    }).catch((err) => {
      this.message.error(err);
    });
  }
}
