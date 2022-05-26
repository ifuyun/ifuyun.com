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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import {
  AVATAR_API_URL,
  STORAGE_DISLIKED_COMMENTS_KEY,
  STORAGE_LIKED_COMMENTS_KEY,
  STORAGE_VOTED_POSTS_KEY
} from '../../config/constants';
import { ResponseCode } from '../../config/response-code.enum';
import { CommonService } from '../../core/common.service';
import { MetaService } from '../../core/meta.service';
import { PageComponent } from '../../core/page.component';
import { PlatformService } from '../../core/platform.service';
import { UrlService } from '../../core/url.service';
import { UserAgentService } from '../../core/user-agent.service';
import { format } from '../../helpers/helper';
import { Comment, CommentEntity, CommentModel } from '../../interfaces/comments';
import { OptionEntity } from '../../interfaces/options';
import { Post, PostEntity, PostModel } from '../../interfaces/posts';
import { TaxonomyEntity } from '../../interfaces/taxonomies';
import { Guest } from '../../interfaces/users';
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
  comments: Comment[] = [];
  post!: PostModel;
  postMeta: Record<string, string> = {};
  postTags: TaxonomyEntity[] = [];
  postCategories: TaxonomyEntity[] = [];
  crumbs: BreadcrumbEntity[] = [];
  showCrumb = true;
  clickedImage!: HTMLImageElement | string;
  showImgModal = false;
  imgModalPadding = 0;
  isPage = false;
  captchaUrl = '';
  postVoted = false;
  saveLoading = false;
  voteLoading = false;
  replyMode = false;
  replyVisibleMap: Record<string, boolean> = {};
  commentVoteLoading: Record<string, boolean> = {};

  private postId = '';
  private postSlug = '';
  private user: Guest | null = null;
  private shareUrl = '';
  private options: OptionEntity = {};
  private unlistenImgClick!: Function;
  private referer = '';
  private optionsListener!: Subscription;
  private urlListener!: Subscription;
  private paramListener!: Subscription;
  private userListener!: Subscription;
  private commentFormConfig = {
    author: ['', [Validators.required, Validators.maxLength(10)]],
    email: ['', [Validators.required, Validators.maxLength(100), Validators.email]],
    captcha: ['', [Validators.required, Validators.maxLength(4)]],
    content: ['', [Validators.required, Validators.maxLength(400)]],
    commentParent: [],
    commentTop: []
  };

  private readonly headerHeight!: number;

  commentForm = this.fb.group(this.commentFormConfig);
  replyForm = this.fb.group(this.commentFormConfig);

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
    this.headerHeight = this.isMobile ? 56 : 60;
  }

  ngOnInit(): void {
    this.urlListener = this.urlService.urlInfo$.subscribe((url) => {
      this.referer = url.previous;
    });
    this.initOptions();
    this.paramListener = this.route.params.subscribe((params) => {
      this.postId = params['postId']?.trim();
      this.postSlug = params['postSlug']?.trim();
      this.postSlug ? this.fetchPage() : this.fetchPost();
      this.scroller.scrollToPosition([0, 0]);
      this.resetCommentForm(this.commentForm);
      this.resetReplyStatus();
    });
  }

  ngAfterViewInit() {
    if (this.platform.isBrowser) {
      const user = this.usersService.getCommentUser();
      if (user) {
        this.user = { ...user };
        setTimeout(() => {
          this.commentForm.get('author')?.setValue(this.user?.name);
          this.commentForm.get('email')?.setValue(this.user?.email);
          this.replyForm.get('author')?.setValue(this.user?.name);
          this.replyForm.get('email')?.setValue(this.user?.email);
        }, 0);
      } else {
        this.userListener = this.usersService.getLoginUser().subscribe((user) => {
          if (user.userName) {
            this.user = {
              name: user.userName,
              email: user.userEmail || ''
            };
            this.commentForm.get('author')?.setValue(this.user.name);
            this.commentForm.get('email')?.setValue(this.user.email);
            this.replyForm.get('author')?.setValue(this.user.name);
            this.replyForm.get('email')?.setValue(this.user.email);
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
    this.optionsListener.unsubscribe();
    this.urlListener.unsubscribe();
    this.paramListener.unsubscribe();
    this.userListener?.unsubscribe();
    this.unlistenImgClick();
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
      const { author, email, captcha, content, commentParent, commentTop } = form.value;
      const commentDto: CommentEntity = {
        postId: this.postId,
        commentParent: commentParent || '',
        commentTop: commentTop || '',
        captchaCode: captcha,
        commentContent: content,
        authorName: author,
        authorEmail: email
      };
      this.saveLoading = true;
      this.commentsService.saveComment(commentDto).subscribe((res) => {
        this.saveLoading = false;
        if (res.code === 0) {
          const msg = res.data.status === 'success' ? '评论成功' : '评论成功，审核通过后将显示在页面上';
          this.message.success(msg);
          const cachedReplyMode = this.replyMode;
          this.replyMode = false;
          this.resetCommentForm(form);
          this.resetReplyVisible();
          this.refreshCaptcha();
          this.fetchComments(() => {
            !cachedReplyMode && this.scroller.scrollToAnchor('comments');
          });
        }
      });
    }
  }

  toggleImgModal(status: boolean) {
    this.showImgModal = status;
  }

  votePost(like: boolean) {
    if (this.postVoted || this.voteLoading) {
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
    this.voteLoading = true;
    this.votesService.saveVote(voteData).subscribe((res) => {
      this.voteLoading = false;
      if (res.code === ResponseCode.SUCCESS) {
        this.postMeta['post_vote'] = res.data.likes.toString();
        this.postVoted = true;

        const likedPosts = (localStorage.getItem(STORAGE_VOTED_POSTS_KEY) || '').split(',');
        likedPosts.push(this.postId);
        localStorage.setItem(STORAGE_VOTED_POSTS_KEY, uniq(likedPosts.filter((item) => !!item)).join(','));
      }
    });
  }

  voteComment(comment: CommentModel, like: boolean) {
    const likedComments = (localStorage.getItem(STORAGE_LIKED_COMMENTS_KEY) || '').split(',');
    const dislikedComments = (localStorage.getItem(STORAGE_DISLIKED_COMMENTS_KEY) || '').split(',');
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
    if (this.user) {
      voteData.user = this.user;
    }
    this.votesService.saveVote(voteData).subscribe((res) => {
      this.commentVoteLoading[comment.commentId] = false;
      if (res.code === ResponseCode.SUCCESS) {
        comment.commentLikes = res.data.likes;
        comment.commentDislikes = res.data.dislikes;
        if (like) {
          comment.liked = true;
          likedComments.push(comment.commentId);
          localStorage.setItem(STORAGE_LIKED_COMMENTS_KEY, uniq(likedComments.filter((item) => !!item)).join(','));
        } else {
          comment.disliked = true;
          dislikedComments.push(comment.commentId);
          localStorage.setItem(STORAGE_DISLIKED_COMMENTS_KEY, uniq(dislikedComments.filter((item) => !!item)).join(','));
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
    const captchaUrl = this.captchaUrl.split('?')[0];
    if (e) {
      (e.target as HTMLImageElement).src = `${captchaUrl}?r=${Math.random()}`;
    } else {
      setTimeout(() => this.captchaImg.nativeElement.src = `${captchaUrl}?r=${Math.random()}`);
    }
  }

  scrollToComment(e: MouseEvent) {
    const hash = (e.target as HTMLElement).dataset['hash'] || '';
    const offsetTop = this.document.getElementById(hash)?.offsetTop || 0;
    if (offsetTop > 0) {
      this.scroller.scrollToPosition([0, offsetTop - this.headerHeight]);
    }
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

  private initOptions() {
    this.optionsListener = this.optionsService.options$.subscribe((options) => {
      this.options = options;
      if (this.options['site_url']) {
        this.captchaUrl = `${this.options['site_url']}${ApiUrl.API_URL_PREFIX}${ApiUrl.CAPTCHA}?r=${Math.random()}`;
      }
    });
  }

  private initMeta() {
    const keywords: string[] = (this.options['site_keywords'] || '').split(',');
    this.metaService.updateHTMLMeta({
      title: `${this.post.postTitle} - ${this.options['site_name']}`,
      description: this.post.postExcerpt,
      author: this.options['site_author'],
      keywords: uniq(this.postTags.map((item) => item.taxonomyName).concat(keywords)).join(',')
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

  private initComment(comment: Comment) {
    const initialFn = (data: Comment) => {
      data.authorAvatar = format(AVATAR_API_URL, data.authorEmailHash);
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
      const likedComments = (localStorage.getItem(STORAGE_LIKED_COMMENTS_KEY) || '').split(',');
      const dislikedComments = (localStorage.getItem(STORAGE_DISLIKED_COMMENTS_KEY) || '').split(',');
      comments.forEach((item) => {
        likedComments.includes(item.commentId) && (item.liked = true);
        dislikedComments.includes(item.commentId) && (item.disliked = true);
      });
    }
  }

  private fetchComments(cb?: Function) {
    this.commentsService.getCommentsByPostId(this.postId).subscribe((res) => {
      this.comments = res.comments || [];
      this.comments.forEach((item) => {
        this.initComment(item);
        this.initCommentStatus(item.children);
        item.children = this.generateCommentTree(item.children);
        item.children.forEach((child) => child.parent = item);
      });
      this.initCommentStatus(this.comments);
      cb && cb();
    });
  }

  private generateCommentTree(comments: Comment[]) {
    const depth = this.isMobile ? 2 : (Number(this.options['thread_comments_depth']) || 3);
    const copies = [...comments];
    let tree = copies.filter((father) => {
      father.children = copies.filter((child) => {
        if(father.commentId === child.commentParent) {
          child.parent = father;
          return true;
        }
        return false;
      });
      father.isLeaf = father.children.length < 1;
      return father.commentParent === father.commentTop;
    });
    const flattenIterator = (nodes: Comment[], list: Comment[]) => {
      nodes.forEach((node) => {
        list.push({ ...node, isLeaf: true, level: depth, children: [] });
        if (node.children.length > 0) {
          flattenIterator(node.children, list);
        }
      });
      return list;
    };
    const iterator = (nodes: Comment[], level: number) => {
      if (depth === 2) {
        nodes = flattenIterator(nodes, []).sort((a, b) => a.commentCreated > b.commentCreated ? 1 : -1);
      } else {
        nodes.forEach((node) => {
          node.level = level;
          if (node.children.length > 0) {
            if (level < depth - 1) {
              node.children = iterator(node.children, level + 1);
            } else {
              node.children = flattenIterator(node.children, [])
                .sort((a, b) => a.commentCreated > b.commentCreated ? 1 : -1);
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
      const likedPosts = (localStorage.getItem(STORAGE_VOTED_POSTS_KEY) || '').split(',');
      this.postVoted = likedPosts.includes(this.postId);
    }
  }
}
