import { DOCUMENT } from '@angular/common';
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
import { ActivatedRoute } from '@angular/router';
import highlight from 'highlight.js';
import { isEmpty, uniq } from 'lodash';
import * as QRCode from 'qrcode';
import { skipWhile, Subscription } from 'rxjs';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { CommentObjectType } from '../../../components/comment/comment.enum';
import { CommentService } from '../../../components/comment/comment.service';
import { ImageService } from '../../../components/image/image.service';
import { MessageService } from '../../../components/message/message.service';
import { VoteType, VoteValue } from '../../../config/common.enum';
import { STORAGE_KEY_VOTED_POSTS } from '../../../config/constants';
import { Message } from '../../../config/message.enum';
import { ResponseCode } from '../../../config/response-code.enum';
import { CommonService } from '../../../core/common.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { PlatformService } from '../../../core/platform.service';
import { UrlService } from '../../../core/url.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { OptionEntity } from '../../../interfaces/option.interface';
import { TaxonomyEntity } from '../../../interfaces/taxonomy.interface';
import { Guest, UserModel } from '../../../interfaces/user.interface';
import { OptionService } from '../../../services/option.service';
import { UserService } from '../../../services/user.service';
import { FavoriteService } from '../favorite.service';
import { Post, PostEntity, PostModel } from '../post.interface';
import { PostService } from '../post.service';
import { VoteEntity } from '../vote.interface';
import { VoteService } from '../vote.service';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: []
})
export class PostComponent extends PageComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('postEle', { static: false }) postEle!: ElementRef;

  readonly commentObjectType = CommentObjectType.POST;

  isMobile = false;
  isLoggedIn = false;
  user!: UserModel;
  pageIndex = '';
  prevPost: PostEntity | null = null;
  nextPost: PostEntity | null = null;
  post!: PostModel;
  postMeta: Record<string, any> = {};
  postTags: TaxonomyEntity[] = [];
  postCategories: TaxonomyEntity[] = [];
  isFavorite = false;
  showCrumb = true;
  isPage = false;
  postVoted = false;
  voteLoading = false;
  favoriteLoading = false;

  private breadcrumbs: BreadcrumbEntity[] = [];
  private postId = '';
  private postSlug = '';
  private options: OptionEntity = {};
  private unlistenImgClick!: () => void;
  private referer = '';
  private commentUser: Guest | null = null;

  private optionsListener!: Subscription;
  private urlListener!: Subscription;
  private paramListener!: Subscription;
  private userListener!: Subscription;
  private postListener!: Subscription;
  private prevAndNextListener!: Subscription;
  private favoriteListener!: Subscription;

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
    private message: MessageService,
    private platform: PlatformService,
    private renderer: Renderer2
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updatePageOptions();
    this.initOptions();
    this.paramListener = this.route.params.subscribe((params) => {
      this.postId = params['postId']?.trim();
      this.postSlug = params['postSlug']?.trim();
      this.postSlug ? this.fetchPage() : this.fetchPost();
      this.commentService.updateObjectId(this.postId);
    });
    this.urlListener = this.urlService.urlInfo$.subscribe((url) => {
      this.referer = url.previous;
    });
    this.userListener = this.userService.loginUser$.subscribe((user) => {
      this.user = user;
      this.isLoggedIn = !!this.user.userId;
    });
  }

  ngAfterViewInit() {
    if (this.platform.isBrowser) {
      const commentUser = this.userService.getCommentUser();
      if (commentUser) {
        this.commentUser = { ...commentUser };
      }
    }
    this.unlistenImgClick = this.renderer.listen(this.postEle.nativeElement, 'click', (e: MouseEvent) => {
      if (e.target instanceof HTMLImageElement) {
        // todo: if image is in <a> link
        this.imageService.preview([
          {
            src: e.target.src
          }
        ]);
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

  showReward(src: string) {
    this.imageService.preview([
      {
        src,
        padding: 16
      }
    ]);
  }

  showShareQrcode() {
    const siteUrl = this.options['site_url'].replace(/\/$/i, '');
    const postGuid = this.post.postGuid.replace(/^\//i, '');
    const shareUrl = siteUrl + '/' + postGuid + '?ref=qrcode';

    QRCode.toCanvas(shareUrl, {
      width: 320,
      margin: 0
    })
      .then((canvas) => {
        this.imageService.preview([
          {
            src: canvas.toDataURL(),
            padding: 16
          }
        ]);
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
        // unescape: ><&…, etc.
        codeStr = codeStr
          .replace(/&lt;/gi, '<')
          .replace(/&gt;/gi, '>')
          .replace(/&amp;/gi, '&')
          .replace(/&hellip;/gi, '…');
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
