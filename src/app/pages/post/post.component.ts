import { DOCUMENT, ViewportScroller } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
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
import { ApiUrl } from '../../config/api-url';
import { VoteType, VoteValue } from '../../config/common.enum';
import { STORAGE_LIKED_COMMENT_KEY, STORAGE_LIKED_POSTS_KEY } from '../../config/constants';
import { ResponseCode } from '../../config/response-code.enum';
import { CommonService } from '../../core/common.service';
import { MetaService } from '../../core/meta.service';
import { PageComponent } from '../../core/page.component';
import { PlatformService } from '../../core/platform.service';
import { UrlService } from '../../core/url.service';
import { UserAgentService } from '../../core/user-agent.service';
import { CommentEntity, CommentModel } from '../../interfaces/comments';
import { OptionEntity } from '../../interfaces/options';
import { Post, PostEntity, PostModel } from '../../interfaces/posts';
import { TaxonomyEntity } from '../../interfaces/taxonomies';
import { Guest, LoginUserEntity } from '../../interfaces/users';
import { VoteEntity } from '../../interfaces/votes';
import { CommentsService } from '../../services/comments.service';
import { OptionsService } from '../../services/options.service';
import { PostsService } from '../../services/posts.service';
import { UsersService } from '../../services/users.service';
import { VotesService } from '../../services/votes.service';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.less']
})
export class PostComponent extends PageComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('captchaImg') captchaImg!: ElementRef;
  @ViewChild('postEle', { static: false }) postEle!: ElementRef;

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
  clickedImage!: HTMLImageElement | string;
  showImgModal: boolean = false;
  imgModalPadding = 0;
  isPage: boolean = false;
  captchaUrl = '';
  postVoted = false;
  saveLoading = false;

  private postId: string = '';
  private postSlug: string = '';
  private user: Guest | null = null;
  private shareUrl: string = '';
  private options: OptionEntity = {};
  private unlistenImgClick!: Function;
  private referer: string = '';
  private urlListener!: Subscription;
  private paramListener!: Subscription;
  private userListener!: Subscription;

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
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
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
      this.postSlug ? this.fetchPage() : this.fetchPost();
      this.scroller.scrollToPosition([0, 0]);
    });
  }

  ngAfterViewInit() {
    if (this.platform.isBrowser) {
      const user = this.usersService.getCommentUser();
      if (user) {
        this.user = user;
        this.commentForm.get('author')?.setValue(user.name);
        this.commentForm.get('email')?.setValue(user.email);
      } else {
        this.userListener = this.usersService.getLoginUser().subscribe((user) => {
          if (user.userName) {
            this.user = {
              name: user.userName,
              email: user.userEmail || ''
            };
            this.commentForm.get('author')?.setValue(this.user.name);
            this.commentForm.get('email')?.setValue(this.user.email);
          }
        });
      }
    }
    this.unlistenImgClick = this.renderer.listen(this.postEle.nativeElement, 'click', ((e: MouseEvent) => {
      if (e.target instanceof HTMLImageElement) {
        // todo: if image is in <a> link
        this.imgModalPadding = 0;
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
      this.saveLoading = true;
      this.commentsService.saveComment(commentDto).subscribe((res) => {
        this.saveLoading = false;
        if (res.code === 0) {
          const msg = res.data.status === 'success' ? '评论成功' : '评论成功，审核通过后将显示在页面上';
          this.message.success(msg);
          this.resetCommentForm();
          this.captchaImg.nativeElement.src = `${this.captchaUrl}?r=${Math.random()}`;
          this.fetchComments(() => {
            this.scroller.scrollToAnchor('comments');
          });
        }
      });
    }
  }

  toggleImgModal(status: boolean) {
    this.showImgModal = status;
  }

  votePost(like: boolean) {
    if (this.postVoted) {
      return;
    }
    const voteData: VoteEntity = {
      objectId: this.postId,
      value: like ? VoteValue.LIKE : VoteValue.DISLIKE,
      type: VoteType.POST
    };
    if (this.user) {
      voteData.user = this.user;
    }
    this.votesService.saveVote(voteData).subscribe((res) => {
      if (res.code === ResponseCode.SUCCESS) {
        this.postMeta['post_vote'] = res.data.vote.toString();
        this.postVoted = true;

        const likedPosts = (localStorage.getItem(STORAGE_LIKED_POSTS_KEY) || '').split(',');
        likedPosts.push(this.postId);
        localStorage.setItem(STORAGE_LIKED_POSTS_KEY, uniq(likedPosts.filter((item) => !!item)).join(','));
      }
    });
  }

  voteComment(comment: CommentModel, like: boolean) {
    if ((localStorage.getItem(STORAGE_LIKED_COMMENT_KEY) || '').split(',').includes(comment.commentId)) {
      return;
    }
    const voteData: VoteEntity = {
      objectId: comment.commentId,
      value: like ? VoteValue.LIKE : VoteValue.DISLIKE,
      type: VoteType.COMMENT
    };
    if (this.user) {
      voteData.user = this.user;
    }
    this.votesService.saveVote(voteData).subscribe((res) => {
      if (res.code === ResponseCode.SUCCESS) {
        comment.commentVote = res.data.vote;
        comment.voted = true;

        const likedComments = (localStorage.getItem(STORAGE_LIKED_COMMENT_KEY) || '').split(',');
        likedComments.push(comment.commentId);
        localStorage.setItem(STORAGE_LIKED_COMMENT_KEY, uniq(likedComments.filter((item) => !!item)).join(','));
      }
    });
  }

  replyComment(comment: CommentModel) {
    this.commentForm.get('commentParent')?.setValue(comment.commentId);
    this.scroller.scrollToAnchor('respond');
  }

  refreshCaptcha(e: MouseEvent) {
    (e.target as HTMLImageElement).src = `${this.captchaUrl}?r=${Math.random()}`;
  }

  showReward(src: string) {
    this.clickedImage = src;
    this.imgModalPadding = 16;
    this.showImgModal = true;
  }

  showShareQrcode() {
    this.clickedImage = '';
    this.imgModalPadding = 16;
    this.showImgModal = true;
    setTimeout(() => this.generateShareQrcode(), 0);
  }

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.pageIndex);
  }

  private initMeta() {
    this.optionsService.options$.subscribe((options) => {
      this.options = options;
      this.captchaUrl = `${this.options['site_url']}${ApiUrl.API_URL_PREFIX}${ApiUrl.CAPTCHA}`;

      const keywords: string[] = (options['site_keywords'] || '').split(',');
      this.metaService.updateHTMLMeta({
        title: `${this.post.postTitle} - ${options?.['site_name']}`,
        description: this.post.postExcerpt,
        author: options?.['site_author'],
        keywords: uniq(this.postTags.map((item) => item.taxonomyName).concat(keywords)).join(',')
      });
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

  private fetchPage() {
    this.postsService.getPostBySlug(this.postSlug).subscribe((post) => {
      if (post && post.post && post.post.postId) {
        this.initData(post, true);
      }
    });
  }

  private initData(post: Post, isPage: boolean) {
    this.post = post.post;
    this.postId = this.post?.postId;
    this.postMeta = post.meta;
    this.postTags = post.tags;
    this.postCategories = post.categories;
    this.pageIndex = (isPage ? post.post.postName : post.crumbs?.[0].slug) || '';
    this.updateActivePage();
    if (!isPage) {
      this.crumbs = post.crumbs || [];
      this.crumbService.updateCrumb(this.crumbs);
    }
    this.showCrumb = !isPage;
    this.isPage = isPage;
    this.initMeta();
    this.updatePostVoted();
    this.parseHtml();
    this.fetchComments();
  }

  private fetchComments(cb?: Function) {
    this.commentsService.getCommentsByPostId(this.postId).subscribe((comments) => {
      this.comments = comments.comments || [];
      if (this.platform.isBrowser) {
        const likedComments = (localStorage.getItem(STORAGE_LIKED_COMMENT_KEY) || '').split(',');
        this.comments.forEach((item) => {
          if (likedComments.includes(item.commentId)) {
            item.voted = true;
          }
        });
      }
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
        // unescape: ><&
        codeStr = codeStr.replace(/&lt;/ig, '<')
          .replace(/&gt;/ig, '>')
          .replace(/&amp;/ig, '&');
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

  private generateShareQrcode() {
    const siteUrl = this.options['site_url'].replace(/\/$/i, '');
    const postGuid = this.post.postGuid.replace(/^\//i, '');
    this.shareUrl = siteUrl + '/' + postGuid + '?ref=qrcode';

    QRCode.toCanvas(this.shareUrl, {
      width: 320,
      margin: 0
    }).then((canvas) => {
      const modalEle = this.document.querySelector('.modal-content-body');
      modalEle?.appendChild(canvas);
    }).catch((err) => {
      this.message.error(err);
    });
  }

  private updatePostVoted() {
    if (this.platform.isBrowser) {
      const likedPosts = (localStorage.getItem(STORAGE_LIKED_POSTS_KEY) || '').split(',');
      this.postVoted = likedPosts.includes(this.postId);
    }
  }
}
