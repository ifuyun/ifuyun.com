import { CommonModule, DatePipe } from '@angular/common';
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
import { ActivatedRoute, RouterLink } from '@angular/router';
import highlight from 'highlight.js';
import { isEmpty, uniq } from 'lodash';
import * as QRCode from 'qrcode';
import { combineLatestWith, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from '../../../components/breadcrumb/breadcrumb.component';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { CommentComponent } from '../../../components/comment/comment.component';
import { CommentObjectType } from '../../../components/comment/comment.enum';
import { CommentService } from '../../../components/comment/comment.service';
import { ImageModule } from '../../../components/image/image.module';
import { ImageService } from '../../../components/image/image.service';
import { MakeMoneyComponent } from '../../../components/make-money/make-money.component';
import { MessageService } from '../../../components/message/message.service';
import { STORAGE_KEY_VOTED_POSTS, PATH_WECHAT_CARD, PATH_WECHAT_REWARD } from '../../../config/common.constant';
import { VoteType, VoteValue } from '../../../config/common.enum';
import { Message } from '../../../config/message.enum';
import { ResponseCode } from '../../../config/response-code.enum';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { PlatformService } from '../../../core/platform.service';
import { UrlService } from '../../../core/url.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { OptionEntity } from '../../../interfaces/option.interface';
import { TaxonomyEntity } from '../../../interfaces/taxonomy.interface';
import { Guest, UserModel } from '../../../interfaces/user.interface';
import { CopyrightTypeDescPipe } from '../../../pipes/copyright-type-desc.pipe';
import { CopyrightTypePipe } from '../../../pipes/copyright-type.pipe';
import { NumberViewPipe } from '../../../pipes/number-view.pipe';
import { SafeHtmlPipe } from '../../../pipes/safe-html.pipe';
import { OptionService } from '../../../services/option.service';
import { UserService } from '../../../services/user.service';
import { FavoriteService } from '../favorite.service';
import { Post, PostEntity, PostModel } from '../post.interface';
import { PostService } from '../post.service';
import { VoteEntity } from '../vote.interface';
import { VoteService } from '../vote.service';

@Component({
  selector: 'app-post',
  standalone: true,
  providers: [DestroyService],
  imports: [
    CommonModule,
    RouterLink,
    BreadcrumbComponent,
    CommentComponent,
    ImageModule,
    MakeMoneyComponent,
    DatePipe,
    SafeHtmlPipe,
    CopyrightTypePipe,
    CopyrightTypeDescPipe,
    NumberViewPipe
  ],
  templateUrl: './post.component.html',
  styleUrls: [],
  encapsulation: ViewEncapsulation.None
})
export class PostComponent extends PageComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('postEle', { static: false }) postEle!: ElementRef;

  readonly commentObjectType = CommentObjectType.POST;
  readonly wechatCardPath = PATH_WECHAT_CARD;

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

  constructor(
    private destroy$: DestroyService,
    private route: ActivatedRoute,
    private platform: PlatformService,
    private userAgentService: UserAgentService,
    private metaService: MetaService,
    private commonService: CommonService,
    private breadcrumbService: BreadcrumbService,
    private urlService: UrlService,
    private optionService: OptionService,
    private userService: UserService,
    private postService: PostService,
    private commentService: CommentService,
    private voteService: VoteService,
    private favoriteService: FavoriteService,
    private imageService: ImageService,
    private message: MessageService,
    private renderer: Renderer2
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updatePageOptions();
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        combineLatestWith(this.route.params),
        takeUntil(this.destroy$)
      )
      .subscribe(([options, params]) => {
        this.options = options;
        this.postId = params['postId']?.trim();
        this.postSlug = params['postSlug']?.trim();
        this.postSlug ? this.fetchPage() : this.fetchPost();
        this.commentService.updateObjectId(this.postId);
      });
    this.urlService.urlInfo$.pipe(takeUntil(this.destroy$)).subscribe((url) => {
      this.referer = url.previous;
    });
    this.userService.loginUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
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
        this.imageService.preview([
          {
            src: e.target.src
          }
        ]);
        e.preventDefault();
        e.stopPropagation()
      }
    });
  }

  ngOnDestroy() {
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
    this.voteService
      .saveVote(voteData)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
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

  showReward() {
    const previewRef = this.imageService.preview([
      {
        src: PATH_WECHAT_REWARD
      }
    ]);
    this.commonService.addPaddingToImagePreview(previewRef.previewInstance.imagePreviewWrapper);
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
        const previewRef = this.imageService.preview([
          {
            src: canvas.toDataURL()
          }
        ]);
        this.commonService.addPaddingToImagePreview(previewRef.previewInstance.imagePreviewWrapper);
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
    this.favoriteService
      .addFavorite(this.postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
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

  private initMeta() {
    const keywords: string[] = (this.options['post_keywords'] || '').split(',');
    this.metaService.updateHTMLMeta({
      title: `${this.post.postTitle} - ${this.options['site_name']}`,
      description: this.post.postExcerpt,
      keywords: uniq(this.postTags.map((item) => item.taxonomyName).concat(keywords)).join(','),
      author: this.options['site_author']
    });
  }

  private fetchPost() {
    this.postService
      .getPostById(this.postId, this.referer)
      .pipe(takeUntil(this.destroy$))
      .subscribe((post) => {
        if (post && post.post && post.post.postId) {
          this.initData(post, false);
        }
      });
    this.postService
      .getPostsOfPrevAndNext(this.postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.prevPost = res.prevPost;
        this.nextPost = res.nextPost;
      });
  }

  private fetchPage() {
    this.postService
      .getPostBySlug(this.postSlug)
      .pipe(takeUntil(this.destroy$))
      .subscribe((post) => {
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
    this.pageIndex = isPage ? post.post.postName || '' : 'post';
    this.updateActivePage();
    if (!isPage) {
      const breadcrumbs = (post.breadcrumbs || []).map((item) => {
        item.url = `/post/category/${item.slug}`;
        return item;
      });
      this.breadcrumbs = [...breadcrumbs];
      this.breadcrumbs.unshift({
        label: `文章`,
        tooltip: `文章列表`,
        url: '/post',
        isHeader: false
      });
      this.breadcrumbService.updateBreadcrumb(this.breadcrumbs);
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
