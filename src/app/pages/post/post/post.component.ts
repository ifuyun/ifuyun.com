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
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import highlight from 'highlight.js';
import { cloneDeep, isEmpty, uniq } from 'lodash';
import * as QRCode from 'qrcode';
import { skipWhile, Subscription } from 'rxjs';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { ImageService } from '../../../components/image/image.service';
import { MessageService } from '../../../components/message/message.service';
import { ApiUrl } from '../../../config/api-url';
import { VoteType, VoteValue } from '../../../config/common.enum';
import {
  AVATAR_API_URL,
  STORAGE_KEY_DISLIKED_COMMENTS,
  STORAGE_KEY_LIKED_COMMENTS,
  STORAGE_KEY_VOTED_POSTS
} from '../../../config/constants';
import { Message } from '../../../config/message.enum';
import { ResponseCode } from '../../../config/response-code.enum';
import { CommonService } from '../../../core/common.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { PlatformService } from '../../../core/platform.service';
import { UrlService } from '../../../core/url.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { format } from '../../../helpers/helper';
import { OptionEntity } from '../../../interfaces/option.interface';
import { TaxonomyEntity } from '../../../interfaces/taxonomy.interface';
import { Guest, UserModel } from '../../../interfaces/user.interface';
import { OptionService } from '../../../services/option.service';
import { UserService } from '../../../services/user.service';
import { Comment, CommentEntity, CommentModel } from '../comment.interface';
import { CommentService } from '../comment.service';
import { FavoriteService } from '../favorite.service';
import { Post, PostEntity, PostModel } from '../post.interface';
import { PostService } from '../post.service';
import { VoteEntity } from '../vote.interface';
import { VoteService } from '../vote.service';

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
  isLoggedIn = false;
  user!: UserModel;
  pageIndex = '';
  prevPost: PostEntity | null = null;
  nextPost: PostEntity | null = null;
  comments: Comment[] = [];
  post!: PostModel;
  postMeta: Record<string, any> = {};
  postTags: TaxonomyEntity[] = [];
  postCategories: TaxonomyEntity[] = [];
  isFavorite = false;
  showCrumb = true;
  isPage = false;
  captchaUrl = '';
  postVoted = false;
  saveLoading = false;
  voteLoading = false;
  favoriteLoading = false;
  replyMode = false;
  replyVisibleMap: Record<string, boolean> = {};
  commentVoteLoading: Record<string, boolean> = {};

  private breadcrumbs: BreadcrumbEntity[] = [];
  private postId = '';
  private postSlug = '';
  private commentUser: Guest | null = null;
  private shareUrl = '';
  private options: OptionEntity = {};
  private unlistenImgClick!: () => void;
  private referer = '';
  private optionsListener!: Subscription;
  private urlListener!: Subscription;
  private paramListener!: Subscription;
  private userListener!: Subscription;
  private postListener!: Subscription;
  private prevAndNextListener!: Subscription;
  private favoriteListener!: Subscription;
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
    @Inject(DOCUMENT) private document: Document,
    private optionService: OptionService,
    private userService: UserService,
    private breadcrumbService: BreadcrumbService,
    private commonService: CommonService,
    private postService: PostService,
    private commentService: CommentService,
    private voteService: VoteService,
    private favoriteService: FavoriteService,
    private metaService: MetaService,
    private urlService: UrlService,
    private userAgentService: UserAgentService,
    private imageService: ImageService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private message: MessageService,
    private platform: PlatformService,
    private scroller: ViewportScroller,
    private renderer: Renderer2,
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
    this.headerHeight = this.isMobile ? 56 : 60;
  }

  ngOnInit(): void {
    this.updatePageOptions();
    this.initOptions();
    this.paramListener = this.route.params.subscribe((params) => {
      this.postId = params['postId']?.trim();
      this.postSlug = params['postSlug']?.trim();
      this.postSlug ? this.fetchPage() : this.fetchPost();
      this.scroller.scrollToPosition([0, 0]);
      this.resetCommentForm(this.commentForm);
      this.resetReplyStatus();
    });
    this.urlListener = this.urlService.urlInfo$.subscribe((url) => {
      this.referer = url.previous;
    });
    this.userListener = this.userService.loginUser$.subscribe((user) => {
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
    this.unlistenImgClick = this.renderer.listen(this.postEle.nativeElement, 'click', (e: MouseEvent) => {
      if (e.target instanceof HTMLImageElement) {
        // todo: if image is in <a> link
        this.imageService.preview([{
          src: e.target.src
        }]);
      }
    });
  }

  ngOnDestroy() {
    this.optionsListener.unsubscribe();
    this.urlListener.unsubscribe();
    this.paramListener.unsubscribe();
    this.userListener?.unsubscribe();
    this.postListener.unsubscribe();
    this.prevAndNextListener?.unsubscribe();
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
        postId: this.postId,
        commentParent: commentParent || '',
        commentTop: commentTop || '',
        captchaCode: captcha,
        commentContent: content,
        authorName: author,
        authorEmail: email,
        userId: this.user.userId
      };
      this.saveLoading = true;
      this.commentService.saveComment(commentDto).subscribe((res) => {
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

  votePost(like: boolean) {
    if (this.postVoted || this.voteLoading) {
      return;
    }
    const voteData: VoteEntity = {
      objectId: this.postId,
      value: like ? VoteValue.LIKE : VoteValue.DISLIKE,
      type: this.isPage ? VoteType.PAGE : VoteType.POST
    };
    if (this.commentUser && this.commentUser.name) {
      voteData.user = this.commentUser;
    }
    this.voteLoading = true;
    this.voteService.saveVote(voteData).subscribe((res) => {
      this.voteLoading = false;
      if (res.code === ResponseCode.SUCCESS) {
        this.post.postLikes = res.data.likes;
        this.postVoted = true;

        if (!this.isLoggedIn) {
          const likedPosts = (localStorage.getItem(STORAGE_KEY_VOTED_POSTS) || '').split(',');
          likedPosts.push(this.postId);
          localStorage.setItem(STORAGE_KEY_VOTED_POSTS, uniq(likedPosts.filter((item) => !!item)).join(','));
        }
      }
    });
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
    this.voteService.saveVote(voteData).subscribe((res) => {
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
    const captchaUrl = this.captchaUrl.split('?')[0];
    if (e) {
      (e.target as HTMLImageElement).src = `${captchaUrl}?r=${Math.random()}`;
    } else {
      setTimeout(() => (this.captchaImg.nativeElement.src = `${captchaUrl}?r=${Math.random()}`));
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
    this.imageService.preview([{
      src,
      padding: 16
    }]);
  }

  showShareQrcode() {
    const siteUrl = this.options['site_url'].replace(/\/$/i, '');
    const postGuid = this.post.postGuid.replace(/^\//i, '');
    this.shareUrl = siteUrl + '/' + postGuid + '?ref=qrcode';

    QRCode.toCanvas(this.shareUrl, {
      width: 320,
      margin: 0
    })
      .then((canvas) => {
        this.imageService.preview([{
          src: canvas.toDataURL(),
          padding: 16
        }]);
      })
      .catch((err) => this.message.error(err));
  }

  addFavorite() {
    if (this.favoriteLoading || this.isFavorite) {
      return;
    }
    if (!this.isLoggedIn) {
      this.message.error(Message.ADD_FAVORITE_MUST_LOGIN);
      return;
    }
    this.favoriteLoading = true;
    this.favoriteListener = this.favoriteService.addFavorite(this.postId).subscribe((res) => {
      this.favoriteLoading = false;
      if (res) {
        this.message.success(Message.ADD_FAVORITE_SUCCESS);
        this.isFavorite = true;
      }
    });
  }

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.pageIndex);
  }

  protected updatePageOptions(): void {
    this.commonService.updatePageOptions({
      showHeader: true,
      showFooter: true,
      showMobileHeader: true,
      showMobileFooter: true
    });
  }

  private initOptions() {
    this.optionsListener = this.optionService.options$
      .pipe(skipWhile((options) => isEmpty(options)))
      .subscribe((options) => {
        this.options = options;
        if (this.options['site_url'] && this.platform.isBrowser) {
          this.captchaUrl = `${this.options['site_url']}${ApiUrl.API_URL_PREFIX}${ApiUrl.CAPTCHA}?r=${Math.random()}`;
        }
      });
  }

  private initMeta() {
    const keywords: string[] = (this.options['site_keywords'] || '').split(',');
    this.metaService.updateHTMLMeta({
      title: `${this.post.postTitle} - ${this.options['site_name']}`,
      description: this.post.postExcerpt,
      keywords: uniq(this.postTags.map((item) => item.taxonomyName).concat(keywords)).join(','),
      author: this.options['site_author']
    });
  }

  private fetchPost() {
    this.postListener = this.postService.getPostById(this.postId, this.referer).subscribe((post) => {
      if (post && post.post && post.post.postId) {
        this.initData(post, false);
      }
    });
    this.prevAndNextListener = this.postService.getPostsOfPrevAndNext(this.postId).subscribe((res) => {
      this.prevPost = res.prevPost;
      this.nextPost = res.nextPost;
    });
  }

  private fetchPage() {
    this.postListener = this.postService.getPostBySlug(this.postSlug).subscribe((post) => {
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
    this.isFavorite = post.isFavorite;
    this.postVoted = post.voted;
    this.pageIndex = (isPage ? post.post.postName : post.breadcrumbs?.[0].slug) || '';
    this.updateActivePage();
    if (!isPage) {
      this.breadcrumbs = post.breadcrumbs || [];
      this.breadcrumbService.updateCrumb(this.breadcrumbs);
    }
    this.showCrumb = !isPage;
    this.isPage = isPage;
    !this.postVoted && this.checkPostVoted();
    this.initMeta();
    this.parseHtml();
    this.fetchComments();
  }

  private initComment(comment: Comment) {
    const initialFn = (data: Comment) => {
      let defaultAvatar = this.options['avatar_default'];
      if (!defaultAvatar || defaultAvatar === 'logo') {
        defaultAvatar = this.options['site_url'] + '/logo.png';
      }
      data.authorAvatar =
        data.user?.userAvatar ||
        format(AVATAR_API_URL, data.user?.userEmailHash || data.authorEmailHash, defaultAvatar);
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
    this.commentService.getCommentsByPostId(this.postId).subscribe((res) => {
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

  private parseHtml() {
    this.post.postContent = this.post.postContent.replace(
      /<pre(?:\s+[^>]*)*>\s*<code(?:\s+[^>]*)?>([\s\S]*?)<\/code>\s*<\/pre>/gi,
      (preStr, codeStr: string) => {
        const langReg = /^<pre(?:\s+[^>]*)*\s+class="([^"]+)"(?:\s+[^>]*)*>/gi;
        const langResult = Array.from(preStr.matchAll(langReg));
        let langStr = '';
        let language = '';
        if (langResult.length > 0 && langResult[0].length === 2) {
          const langClass = langResult[0][1]
            .split(/\s+/i)
            .filter((item) => item.split('-')[0].toLowerCase() === 'language');
          if (langClass.length > 0) {
            langStr = langClass[0].split('-')[1] || '';
            if (langStr && highlight.getLanguage(langStr)) {
              language = langStr;
            }
          }
        }
        // unescape: ><&
        codeStr = codeStr.replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&amp;/gi, '&');
        const lines = codeStr
          .split(/\r\n|\r|\n/i)
          .map((str, i) => `<li>${i + 1}</li>`)
          .join('');
        const codes = language
          ? highlight.highlight(codeStr, { language }).value
          : highlight.highlightAuto(codeStr).value;

        return (
          `<pre class="i-code"${langStr ? ' data-lang="' + langStr + '"' : ''}>` +
          `<ul class="i-code-lines">${lines}</ul>` +
          `<code class="i-code-text">${codes}</code></pre>`
        );
      }
    );
  }

  private checkPostVoted() {
    if (this.platform.isBrowser) {
      const likedPosts = (localStorage.getItem(STORAGE_KEY_VOTED_POSTS) || '').split(',');
      this.postVoted = likedPosts.includes(this.postId);
    }
  }
}
