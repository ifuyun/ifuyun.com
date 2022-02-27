import { ViewportScroller } from '@angular/common';
import { Component, ElementRef, OnInit, Renderer2, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import * as QRCode from 'qrcode';
import { POST_DESCRIPTION_LENGTH } from '../../config/constants';
import { cutStr, filterHtmlTag } from '../../helpers/helper';
import { CommentDto, CommentEntity } from '../../interfaces/comments';
import { CrumbEntity } from '../../interfaces/crumb';
import { OptionEntity } from '../../interfaces/options';
import { PostContent, PostEntity, PostModel } from '../../interfaces/posts';
import { TaxonomyEntity } from '../../interfaces/taxonomies';
import { LoginUserEntity } from '../../interfaces/users';
import { CommentsService } from '../../services/comments.service';
import { CrumbService } from '../../services/crumb.service';
import { CustomMetaService } from '../../services/custom-meta.service';
import { OptionsService } from '../../services/options.service';
import { PostsService } from '../../services/posts.service';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class PostComponent implements OnInit {
  private postId: string = '';
  private loginUser: LoginUserEntity = {};
  private shareUrl: string = '';
  private options: OptionEntity = {};
  private unlistenClick!: Function;

  prevPost: PostEntity | null = null;
  nextPost: PostEntity | null = null;
  comments: CommentEntity[] = [];
  post: PostModel | null = null;
  postMeta: Record<string, string> = {};
  postTags: TaxonomyEntity[] = [];
  postCategories: TaxonomyEntity[] = [];
  crumbs: CrumbEntity[] = [];
  showCrumb: boolean = true;
  showQrcodeOfShare: boolean = false;
  showQrcodeOfReward: boolean = false;
  clickedImage!: HTMLImageElement;
  showImgModal: boolean = false;
  postContents: PostContent[] = [];

  @ViewChild('captchaImg') captchaImg!: ElementRef;
  @ViewChild('qrcodeCanvas') qrcodeCanvas!: ElementRef;
  @ViewChild('postContent', { static: false }) postContentEle!: ElementRef;

  commentForm = this.fb.group({
    author: ['', [Validators.required, Validators.maxLength(8)]],
    email: ['', [Validators.required, Validators.maxLength(100), Validators.email]],
    captcha: ['', [Validators.required, Validators.maxLength(4)]],
    content: ['', [Validators.required, Validators.maxLength(400)]]
  });

  constructor(
    private router: ActivatedRoute,
    private postsService: PostsService,
    private commentsService: CommentsService,
    private usersService: UsersService,
    private crumbService: CrumbService,
    private optionsService: OptionsService,
    private metaService: CustomMetaService,
    private fb: FormBuilder,
    private message: NzMessageService,
    private scroller: ViewportScroller,
    private renderer: Renderer2
  ) {
  }

  ngOnInit(): void {
    this.router.params.subscribe((params) => {
      this.postId = params['postId']?.trim();
    });
    this.postsService.getPostById(this.postId).subscribe((post) => {
      this.post = post.post;
      this.analysePost();
      this.postMeta = post.meta;
      this.postTags = post.tags;
      this.postCategories = post.categories;
      this.crumbs = post.crumbs || [];
      this.crumbService.updateCrumb(this.crumbs);
      this.optionsService.options$.subscribe((options) => {
        this.options = options;
        this.metaService.updateHTMLMeta({
          title: `${post.post.postTitle} - ${options?.['site_name']}`,
          description: post.post.postExcerpt || cutStr(filterHtmlTag(post.post.postContent), POST_DESCRIPTION_LENGTH),
          author: options?.['site_author'],
          keywords: options?.['site_keywords']
        });
        this.initQrcode();
      });
    });
    this.postsService.getPostsOfPrevAndNext(this.postId).subscribe((res) => {
      this.prevPost = res.prevPost;
      this.nextPost = res.nextPost;
    });
    this.fetchComments();
    this.usersService.getLoginUser().subscribe((user) => {
      this.loginUser = user;
      this.commentForm.get('author')?.setValue(user.userName);
      this.commentForm.get('email')?.setValue(user.userEmail);
    });
  }

  private analysePost() {
    const codeReg = /<pre(?:\s+class="([a-zA-Z0-9-\s]+)")?>\s*<code>([\s\S]*?)<\/code>\s*<\/pre>/ig;
    const splitReg = /<pre(?:\s+class="[a-zA-Z0-9-\s]+")?>\s*<code>[\s\S]*?<\/code>\s*<\/pre>/i;
    const contents = this.post?.postContent.split(splitReg) || [];
    const codes: { lang: string[], code: string }[] = [];
    Array.from(this.post?.postContent.matchAll(codeReg) || []).forEach((result) => {
      const langs = (result[1]?.split(' ') || []).map((item) => {
        const lang = item.split('-');
        return lang.length > 1 ? lang[1] : lang[0] || '';
      });
      codes.push({
        lang: langs,
        code: result[2]
      });
    });
    contents.forEach((content, i) => {
      this.postContents.push({
        isCode: false,
        body: content,
        lang: []
      });
      if (i < contents.length - 1) {
        this.postContents.push({
          isCode: true,
          body: codes[i].code,
          lang: codes[i].lang
        });
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
      const { author, email, captcha, content } = this.commentForm.value;
      const commentDto: CommentDto = {
        postId: this.postId,
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

  ngAfterViewInit() {
    this.unlistenClick = this.renderer.listen(this.postContentEle.nativeElement, 'click', ((e: MouseEvent) => {
      if (e.target instanceof HTMLImageElement) {
        this.clickedImage = e.target;
        this.showImgModal = true;
      }
    }));
  }

  ngOnDestroy() {
    this.unlistenClick();
  }
}