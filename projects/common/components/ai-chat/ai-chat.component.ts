import { DatePipe } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  OnInit,
  output,
  signal,
  viewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BaseComponent, DestroyService, Message, OptionEntity, ResponseCode, UserModel } from 'common/core';
import { ConversationStatus, Permission, UserAiStatus } from 'common/enums';
import { IconDeepThinkingComponent } from 'common/icons';
import { Bot, BotConversationModel, PostVo, Wallpaper } from 'common/interfaces';
import { SafeHtmlPipe } from 'common/pipes';
import { BotConversationService, BotService, OptionService, UserService } from 'common/services';
import { format, generateId } from 'common/utils';
import { isEmpty } from 'lodash';
import { marked } from 'marked';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImage, NzImageService } from 'ng-zorro-antd/image';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { ClipboardModule } from 'ngx-clipboard';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { MessageRole, ReasoningEffort } from './ai-chat.enum';
import { ChatMessage, StreamChatEvent, StreamChatParam } from './ai-chat.interface';
import { AiChatService } from './ai-chat.service';

@Component({
  selector: 'lib-ai-chat',
  imports: [
    FormsModule,
    DatePipe,
    SafeHtmlPipe,
    NzDrawerModule,
    NzIconModule,
    NzAlertModule,
    NzEmptyModule,
    NzSpinModule,
    NzInputModule,
    ClipboardModule,
    NzButtonComponent,
    NzDropdownModule,
    IconDeepThinkingComponent
  ],
  providers: [DestroyService, NzImageService],
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.less']
})
export class AiChatComponent extends BaseComponent implements OnInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly injector = inject(Injector);
  private readonly route = inject(ActivatedRoute);
  private readonly message = inject(NzMessageService);
  private readonly imageService = inject(NzImageService);
  private readonly optionService = inject(OptionService);
  private readonly userService = inject(UserService);
  private readonly botService = inject(BotService);
  private readonly botConversationService = inject(BotConversationService);
  private readonly botChatService = inject(AiChatService);

  readonly conversationId = model<string>('');
  readonly showAvatar = input<boolean>(true);
  readonly prompt = model<string>('');
  readonly targetType = model<'post' | 'wallpaper'>('post');
  readonly post = input<PostVo | null>(null);
  readonly wallpaper = input<Wallpaper | null>(null);
  readonly closeDrawer = output<void>();

  readonly chatBody = viewChild.required<ElementRef<HTMLDivElement>>('chatBody');

  readonly noAuthMessage = Message.USER_CHAT_BOT_IS_CLOSED;
  readonly expiredMessage = Message.USER_CHAT_BOT_IS_EXPIRED;
  readonly notOwnerMessage = Message.USER_CHAT_IS_NOT_OWNER;
  readonly isTrashedMessage = Message.USER_CHAT_IS_TRASHED;
  readonly outOfLimitMessage = Message.USER_CHAT_LIMIT_IS_UP;

  readonly effortList: Array<{ label: string; value: ReasoningEffort }> = [
    { label: 'None', value: null },
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Max', value: 'xhigh' }
  ];

  readonly authChat = signal<boolean>(false);
  readonly isChatLimit = signal<boolean>(false);
  readonly initialized = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly messageLoading = signal<boolean>(false);
  readonly messages = signal<ChatMessage[]>([]);
  readonly conversation = signal<BotConversationModel | null>(null);
  readonly bot = signal<Bot | null>(null);
  readonly avatarUrl = signal<string>('');
  readonly errorMessage = signal<string>(Message.DEFAULT_CHAT_ERROR_MESSAGE);
  readonly activeEffort = signal<ReasoningEffort>(null);
  readonly effortVisible = signal<boolean>(false);

  readonly userAiStatus = computed(() => {
    return this.user()?.aiStatus || UserAiStatus.DISABLED;
  });
  readonly noModelAuthMessage = computed(() => {
    const conversation = this.conversation();

    if (conversation?.bot) {
      return format(Message.USER_CHAT_MODEL_IS_DISABLED, conversation.bot.llmModel.displayName);
    }
    return '';
  });
  readonly isChatModelEnabled = computed(() => {
    const conversation = this.conversation();

    if (conversation?.bot) {
      return this.aiModels().includes(conversation.bot.llmModel.id);
    }
    return false;
  });
  readonly isChatEnabled = computed(() => {
    const conversation = this.conversation();

    return (
      this.authChat() &&
      this.userAiStatus() === UserAiStatus.ENABLED &&
      this.isChatModelEnabled() &&
      !this.isChatLimit() &&
      conversation?.userId === this.userId() &&
      conversation?.status === ConversationStatus.NORMAL
    );
  });
  readonly isNotOwner = computed(() => {
    const conversation = this.conversation();

    return (
      this.authChat() &&
      this.userAiStatus() === UserAiStatus.ENABLED &&
      this.isChatModelEnabled() &&
      conversation?.userId !== this.userId()
    );
  });
  readonly isChatTrashed = computed(() => {
    const conversation = this.conversation();

    return (
      this.authChat() &&
      this.userAiStatus() === UserAiStatus.ENABLED &&
      this.isChatModelEnabled() &&
      conversation?.userId === this.userId() &&
      conversation?.status !== ConversationStatus.NORMAL
    );
  });
  readonly conversationUserAvatar = computed(() => {
    return this.conversation()?.user?.avatarUrl || '';
  });

  private readonly noneContent = '无输出';
  private readonly copyTimeout = 2000;

  private readonly options = signal<OptionEntity>({});
  private readonly inputFlag = signal(false);
  private readonly user = signal<UserModel | null>(null);
  private readonly userId = computed(() => {
    return this.user()?.id || '';
  });
  private readonly aiModels = computed(() => {
    return this.user()?.aiModels || [];
  });
  private readonly targetId = computed(() => {
    if (this.targetType() === 'post' && this.post()) {
      return this.post()?.id || '';
    }
    if (this.targetType() === 'wallpaper' && this.wallpaper()) {
      return this.wallpaper()?.id || '';
    }
    return '';
  });

  ngOnInit() {
    combineLatest([this.optionService.options$, this.userService.user$, this.botChatService.getChatUsage()])
      .pipe(
        skipWhile(([options, user]) => isEmpty(options) || !user.id),
        takeUntil(this.destroy$)
      )
      .subscribe(([options, user, chatUsage]) => {
        this.options.set(options);
        this.user.set(user);
        this.isChatLimit.set(chatUsage.limit >= 0 && chatUsage.used >= chatUsage.limit);

        this.initAuth();
        this.getConversation();
      });
  }

  onKeyDown(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    const withCtrlKeys = e.altKey || e.ctrlKey || e.metaKey || e.shiftKey;

    if (key === 'enter' && !this.inputFlag() && !withCtrlKeys) {
      e.preventDefault();
      this.sendStreamMessage();
    }
  }

  onPromptInput(e: Event) {
    const $target = e.target as HTMLTextAreaElement;
    const $chatBody = this.chatBody().nativeElement;
    const threshold = 0;
    const { scrollHeight, scrollTop, clientHeight } = $chatBody;
    const isNearBottom = scrollHeight - scrollTop - clientHeight <= threshold;

    $target.style.height = 'auto';
    $target.style.height = $target.scrollHeight + 2 + 'px';

    if (isNearBottom) {
      $chatBody.scrollTop = $chatBody.scrollHeight;
    } else {
      // 解决跳动问题
      $chatBody.scrollTop = scrollTop;
    }
  }

  onCompositionStart() {
    this.inputFlag.set(true);
  }

  onCompositionEnd() {
    this.inputFlag.set(false);
  }

  setEffort(effort: ReasoningEffort) {
    this.activeEffort.set(effort);
  }

  handleEffortVisibleChange(visible: boolean) {
    this.effortVisible.set(visible);
  }

  startChat() {
    // 如果已经存在对话
    if (this.conversationId()) {
      this.sendStreamMessage();
      return;
    }
    const prompt = this.prompt().trim();
    if (!prompt) {
      this.message.warning('请输入内容');
      this.prompt.set('');
      return;
    }
    if (!this.targetId()) {
      this.message.warning(`${this.targetType() === 'post' ? '文章' : '壁纸'}不存在`);
      return;
    }
    const user = this.user();
    if (user?.aiStatus === UserAiStatus.DISABLED) {
      this.message.error(Message.USER_CHAT_BOT_IS_CLOSED);
      return;
    }
    if (user?.aiStatus === UserAiStatus.EXPIRED) {
      this.message.error(Message.USER_CHAT_BOT_IS_EXPIRED);
      return;
    }

    this.botConversationService
      .askAI({
        targetId: this.targetId(),
        targetType: this.targetType()
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.conversationId) {
          this.conversationId.set(res.conversationId);
          this.sendStreamMessage();
        }
      });
  }

  closeChat() {
    this.closeDrawer.emit();
  }

  sendStreamMessage() {
    if (!this.isChatEnabled() || this.loading()) {
      return;
    }
    if (!this.conversationId()) {
      this.message.error('对话不存在');
      return;
    }
    if (!this.bot()) {
      this.message.error('机器人不存在');
      return;
    }
    const prompt = this.prompt().trim();
    if (!prompt) {
      this.message.warning('请输入内容');
      this.prompt.set('');
      return;
    }

    this.messages.update((messages) => [
      ...messages,
      {
        role: MessageRole.USER,
        content: prompt,
        createdAt: Date.now()
      }
    ]);
    this.prompt.set('');
    this.loading.set(true);
    this.messages.update((messages) => [
      ...messages,
      {
        role: MessageRole.ASSISTANT,
        content: '',
        reasoningContent: '',
        html: '<p></p>',
        loading: true,
        expanded: true,
        vote: 0
      }
    ]);
    this.scrollBottom();

    const params: StreamChatParam = {
      conversationId: this.conversationId(),
      message: prompt
    };
    const effort = this.activeEffort();

    if (effort) {
      params.effort = effort;
    }

    this.botChatService
      .streamChat(params, this.targetType())
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.updateMessage(res);
      });
  }

  toggleThoughtsVisible(msg: ChatMessage) {
    msg.expanded = !msg.expanded;
  }

  onCopied(msg: ChatMessage) {
    msg.copying = true;
    window.setTimeout(() => {
      msg.copying = false;
    }, this.copyTimeout);
  }

  voteMessage(msg: ChatMessage, vote: 1 | -1) {
    if (msg.vote !== 0) {
      return;
    }
    this.botChatService
      .saveMessageVote({
        messageId: msg.id || '',
        vote
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.code === ResponseCode.SUCCESS) {
          msg.vote = vote;
        }
      });
  }

  onMessageClick(e: MouseEvent) {
    this.botChatService.copyCode(e);
  }

  previewAvatar(url?: string) {
    if (!url) {
      return;
    }
    const images: NzImage[] = [
      {
        src: url
      }
    ];
    this.imageService.preview(images);
  }

  private initAuth() {
    const { permissions } = this.user() || {};
    this.authChat.set(!!permissions && permissions.includes(Permission.CONVERSATION_CHAT));
  }

  private getConversation() {
    this.messageLoading.set(true);
    this.botConversationService
      .getConversation(this.conversationId(), this.targetId())
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res && res.id) {
          if (res.user) {
            res.user.avatarUrl = this.userService.getUserAvatar(res.user, this.options()['avatar_default_type']);
          }
          this.conversation.set(res);
          this.conversationId.set(res.id);

          this.bot.set(res.bot || null);
          this.avatarUrl.set(this.botService.getBotAvatar(res.bot));
          this.initialized.set(true);
          // 快速开始对话时无需请求历史消息
          if (!this.prompt()) {
            this.getMessages();
          } else {
            this.messageLoading.set(false);
            this.sendStreamMessage();
          }
        } else {
          this.messageLoading.set(false);
          this.avatarUrl.set(this.botService.getBotAvatar());
          this.initGreeting();
        }
      });
  }

  private getMessages() {
    this.messageLoading.set(true);
    this.botChatService
      .getMessages(this.conversationId())
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.messageLoading.set(false);
        this.messages.set(
          (res || []).map((item) => {
            return {
              id: item.id,
              content: item.content || this.noneContent,
              html: this.parseMarkdown(item.content || this.noneContent),
              reasoningContent: item.reasoningContent || '',
              reasoningHtml: this.parseMarkdown(item.reasoningContent || ''),
              role: item.role,
              createdAt: item.createdAt,
              vote: item.vote,
              status: 'done'
            };
          })
        );
        if (this.isChatEnabled() && this.messages().length < 1) {
          this.initGreeting();
        }
        this.scrollBottom();
      });
  }

  private getGreeting() {
    const bot = this.bot();
    if (bot?.greeting) {
      return bot.greeting;
    }
    const greeting: string =
      '👋 您好，我是智能阅读助手，可以结合本文（**《$0》**）内容为您解答疑问、提供背景知识和相关延伸信息。欢迎向我提问，一起进行更深入的交流。';
    let title = '';
    const post = this.post();
    const wallpaper = this.wallpaper();

    if (this.targetType() === 'post' && post) {
      title = post.title;
    } else if (this.targetType() === 'wallpaper' && wallpaper) {
      const lang = this.route.snapshot.queryParams['lang'] || '';
      title =
        lang === 'en' ? wallpaper.copyrightEn || wallpaper.copyright : wallpaper.copyright || wallpaper.copyrightEn;
    }
    if (title) {
      return greeting.replace('$0', title);
    }
    return '👋 您好，我是智能阅读助手，可以结合本文内容为您解答疑问、提供背景知识和相关延伸信息。欢迎向我提问，一起进行更深入的交流。';
  }

  private initGreeting() {
    const greeting = this.getGreeting();

    this.messages.update((messages) => [
      ...messages,
      {
        id: generateId(),
        content: greeting,
        html: this.parseMarkdown(greeting),
        role: MessageRole.SYSTEM,
        createdAt: Date.now(),
        vote: 0,
        status: 'done'
      }
    ]);
  }

  private scrollBottom(force = false) {
    afterNextRender(
      () => {
        const $chatBody = this.chatBody().nativeElement;
        const threshold = 260;
        const { scrollHeight, scrollTop, clientHeight } = $chatBody;
        const isNearBottom = scrollHeight - scrollTop - clientHeight <= threshold;

        if (isNearBottom || force) {
          $chatBody.scrollTop = $chatBody.scrollHeight;
        }
      },
      { injector: this.injector }
    );
  }

  private updateMessage(msg: StreamChatEvent) {
    const activeMessage = <ChatMessage>this.messages().at(-1);
    switch (msg.type) {
      case 'done':
        activeMessage.content = activeMessage.content || this.noneContent;
        activeMessage.html = this.parseMarkdown(activeMessage.content);
        activeMessage.status = 'done';
        activeMessage.loading = false;

        this.loading.set(false);
        this.scrollBottom();
        break;
      case 'thinking':
        activeMessage.reasoningContent += msg.reasoningMessage || '';
        activeMessage.reasoningHtml = this.parseMarkdown(<string>activeMessage.reasoningContent);
        activeMessage.thinking = true;

        this.scrollBottom();
        break;
      case 'message':
        activeMessage.content += msg.message || '';
        activeMessage.html = this.parseMarkdown(activeMessage.content);
        activeMessage.thinking = false;

        this.scrollBottom();
        break;
      case 'error':
        activeMessage.status = 'error';
        activeMessage.createdAt = Date.now();
        activeMessage.loading = false;

        this.errorMessage.set(msg.message!);
        this.loading.set(false);
        this.message.error(msg.message!);
        this.scrollBottom();
    }
  }

  private parseMarkdown = (msg: string): string => {
    return <string>marked.parse(msg);
  };
}
