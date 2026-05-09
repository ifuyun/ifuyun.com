import { DatePipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source';
import {
  AuthService,
  BaseComponent,
  DestroyService,
  Message,
  OptionEntity,
  ResponseCode,
  UserModel
} from 'common/core';
import { ConversationStatus, Permission, UserLlmStatus } from 'common/enums';
import { Bot, BotConversationModel, Post, Wallpaper } from 'common/interfaces';
import { SafeHtmlPipe } from 'common/pipes';
import { BotConversationService, BotService, OptionService, UserService } from 'common/services';
import { format, generateId, textPosition } from 'common/utils';
import { isEmpty } from 'lodash';
import { marked } from 'marked';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImage, NzImageService } from 'ng-zorro-antd/image';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { ClipboardModule, ClipboardService } from 'ngx-clipboard';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { ICON_COPIED, ICON_COPY } from './ai-chat.constant';
import { MessageRole } from './ai-chat.enum';
import { ChatEventData, ChatMessage, ChatResponse } from './ai-chat.interface';
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
    ClipboardModule
  ],
  providers: [DestroyService, NzImageService],
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.less']
})
export class AiChatComponent extends BaseComponent implements OnInit, AfterViewInit {
  @Input() conversationId = '';
  @Input() prompt = '';
  @Input() objectType: 'post' | 'wallpaper' = 'post';
  @Input() post: Post | null = null;
  @Input() wallpaper: Wallpaper | null = null;
  @Output() closeDrawer = new EventEmitter();

  @ViewChild('messageList') messageList!: ElementRef;
  @ViewChild('promptInput') promptInput!: ElementRef;

  readonly errorMessage = 'Error occurred while generating.';
  readonly noAuthMessage = Message.USER_CHAT_BOT_IS_CLOSED;
  readonly expiredMessage = Message.USER_CHAT_BOT_IS_EXPIRED;
  readonly notOwnerMessage = Message.USER_CHAT_IS_NOT_OWNER;
  readonly isTrashedMessage = Message.USER_CHAT_IS_TRASHED;
  readonly outOfLimitMessage = Message.USER_CHAT_LIMIT_IS_UP;

  user!: UserModel;
  authChat = false;

  isChatLimit = false;
  initialized = false;
  loading = false;
  messageLoading = false;
  messages: ChatMessage[] = [];
  conversation?: BotConversationModel;
  bot?: Bot;
  botAvatar = '';
  userAvatar = '';

  get noModelAuthMessage() {
    if (this.conversation && this.conversation.bot) {
      return format(Message.USER_CHAT_MODEL_IS_DISABLED, this.conversation.bot.llmModel.llmModelName);
    }
    return '';
  }

  get isChatModelEnabled() {
    if (!this.conversation) {
      return true;
    }
    if (this.conversation.bot) {
      return this.user.userLlmModels.includes(this.conversation.bot.llmModel.llmModelId);
    }
    return false;
  }

  get isChatEnabled() {
    return (
      this.authChat &&
      this.user.userLlmStatus === UserLlmStatus.ENABLED &&
      this.isChatModelEnabled &&
      !this.isChatLimit &&
      (!this.conversation ||
        (this.conversation.userId === this.user.userId &&
          this.conversation.conversationStatus === ConversationStatus.NORMAL))
    );
  }

  get isNotOwner() {
    return (
      this.authChat &&
      this.user.userLlmStatus === UserLlmStatus.ENABLED &&
      this.isChatModelEnabled &&
      this.conversation?.userId !== this.user.userId
    );
  }

  get isChatTrashed() {
    return (
      this.authChat &&
      this.user.userLlmStatus === UserLlmStatus.ENABLED &&
      this.isChatModelEnabled &&
      this.conversation?.userId === this.user.userId &&
      this.conversation?.conversationStatus !== ConversationStatus.NORMAL
    );
  }

  get botName() {
    return this.bot?.botName || 'AI 阅读助手';
  }

  private readonly noneContent = '无输出';
  private readonly copyTimeout = 2000;

  private options: OptionEntity = {};
  private inputFlag = false;
  private finishReason: string | null = '';

  private get objectId() {
    if (this.objectType === 'post' && this.post) {
      return this.post.post.postId;
    }
    if (this.objectType === 'wallpaper' && this.wallpaper) {
      return this.wallpaper.wallpaperId;
    }
    return '';
  }

  constructor(
    private readonly destroy$: DestroyService,
    private readonly route: ActivatedRoute,
    private readonly message: NzMessageService,
    private readonly imageService: NzImageService,
    private readonly optionService: OptionService,
    private readonly userService: UserService,
    private readonly botService: BotService,
    private readonly botConversationService: BotConversationService,
    private readonly botChatService: AiChatService,
    private readonly authService: AuthService,
    private readonly clipboardService: ClipboardService
  ) {
    super();
  }

  ngOnInit() {
    combineLatest([this.optionService.options$, this.userService.user$, this.botChatService.getChatUsage()])
      .pipe(
        skipWhile(([options, user]) => isEmpty(options) || !user.userId),
        takeUntil(this.destroy$)
      )
      .subscribe(([options, user, chatUsage]) => {
        this.options = options;
        this.user = user;
        this.userAvatar = this.userService.getUserAvatar(user, options['avatar_default_type']);
        this.isChatLimit = chatUsage.limit >= 0 && chatUsage.used >= chatUsage.limit;

        this.initAuth();
        this.getConversation();
      });
  }

  ngAfterViewInit() {
    const $promptInput = this.promptInput?.nativeElement;

    $promptInput.addEventListener('compositionstart', () => (this.inputFlag = true), false);
    $promptInput.addEventListener('compositionend', () => (this.inputFlag = false), false);
  }

  startChat() {
    // 如果已经存在对话
    if (this.conversationId) {
      this.sendStreamMessage();
      return;
    }
    const prompt = this.prompt.trim();
    if (!prompt) {
      this.message.warning('请输入内容');
      this.prompt = '';
      return;
    }

    if (!this.objectId) {
      this.message.warning('提问对象不存在');
      return;
    }

    if (this.user.userLlmStatus === UserLlmStatus.DISABLED) {
      this.message.error(Message.USER_CHAT_BOT_IS_CLOSED);
      return;
    }
    if (this.user.userLlmStatus === UserLlmStatus.EXPIRED) {
      this.message.error(Message.USER_CHAT_BOT_IS_EXPIRED);
      return;
    }

    this.botConversationService
      .askAI({
        objectId: this.objectId,
        objectType: this.objectType
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.conversationId) {
          this.conversationId = res.conversationId;
          this.sendStreamMessage();
        }
      });
  }

  closeChat() {
    this.closeDrawer.emit();
  }

  sendStreamMessage() {
    if (!this.isChatEnabled || this.loading) {
      return;
    }
    if (!this.conversationId) {
      this.message.error('对话不存在');
      return;
    }
    const prompt = this.prompt.trim();
    if (!prompt) {
      this.message.warning('请输入内容');
      this.prompt = '';
      return;
    }

    this.messages.push({
      role: MessageRole.USER,
      content: prompt,
      created: Date.now()
    });
    this.prompt = '';
    this.finishReason = '';
    this.loading = true;
    this.messages.push({
      role: MessageRole.ASSISTANT,
      content: '',
      reasoningContent: '',
      html: '<p></p>',
      loading: true,
      expanded: true,
      vote: 0
    });
    this.scrollBottom();

    const ctrl = new AbortController();
    const chatUrl = this.botChatService.getAskUrl(this.objectType);

    fetchEventSource(chatUrl, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + this.authService.getToken()
      },
      body: JSON.stringify({
        conversationId: this.conversationId,
        message: prompt
      }),
      signal: ctrl.signal,
      openWhenHidden: true,
      onopen: async (response) => {
        if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
          return;
        }
        throw new Error(response.status + ': ' + this.errorMessage);
      },
      onmessage: (msg) => {
        if (msg.event === 'error') {
          let errMsg = '';
          try {
            const errData = JSON.parse(msg.data);
            errMsg = errData.message || this.errorMessage;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (e) {
            errMsg = this.errorMessage;
          }
          this.updateMessage({
            type: 'error',
            message: errMsg
          });
          ctrl.abort();
        } else if (msg.event === 'data') {
          try {
            if (msg.data) {
              const botMsg: ChatResponse = JSON.parse(msg.data);
              if (botMsg.choices.length > 0) {
                this.finishReason = botMsg.choices[0].finish_reason;

                if (botMsg.choices[0].delta.reasoning_content) {
                  this.updateMessage({
                    type: 'thinking',
                    reasoningMessage: botMsg.choices[0].delta.reasoning_content
                  });
                }
                if (botMsg.choices[0].delta.content) {
                  this.updateMessage({
                    type: 'message',
                    message: botMsg.choices[0].delta.content
                  });
                }
              }
            }
          } catch (e: any) {
            this.updateMessage({
              type: 'error',
              message: e.message || this.errorMessage
            });
            ctrl.abort();
          }
        } else if (msg.event === 'finish') {
          // finished
          this.updateMessage({
            type: 'done'
          });
          ctrl.abort();
        }
      },
      onerror: (err) => {
        const errMsg = typeof err === 'string' ? err : err?.message || this.errorMessage;

        this.updateMessage({
          type: 'error',
          message: errMsg
        });
        ctrl.abort();

        throw err;
      }
    }).then(() => {
      ctrl.abort();
    });
  }

  onKeyDown(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    const isCtrlPressed = e.altKey || e.ctrlKey || e.metaKey || e.shiftKey;
    const isShiftPressed = e.shiftKey;
    if (key === 'enter') {
      if (!isCtrlPressed) {
        e.preventDefault();
        if (!this.inputFlag) {
          this.startChat();
        }
      } else {
        if (!isShiftPressed) {
          textPosition(<HTMLInputElement>e.target, '\n', false);
        }
      }
    }
  }

  onPromptInput(e: Event) {
    const $target = e.target as HTMLTextAreaElement;
    $target.style.height = 'auto';
    $target.style.height = $target.scrollHeight + 2 + 'px';
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
        messageId: msg.messageId || '',
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
    const $target = e.target as HTMLElement;
    if ($target.classList.contains('i-code-copy')) {
      const $parent = $target.parentNode?.parentNode;
      if ($parent) {
        const $code = $parent.querySelector('.i-code-html');
        const codeText = $code?.textContent;
        if (codeText) {
          this.clipboardService.copy(codeText);
          $target.innerHTML = ICON_COPIED;

          window.setTimeout(() => {
            $target.innerHTML = ICON_COPY;
          }, this.copyTimeout);
        }
      }
      e.preventDefault();
      e.stopPropagation();
    }
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
    const { permissions } = this.user;
    this.authChat = permissions.includes(Permission.CONVERSATION_CHAT);
  }

  private getConversation() {
    this.messageLoading = true;
    this.botConversationService
      .getConversation(this.conversationId, this.objectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res && res.conversationId) {
          this.conversation = res;
          this.conversationId = res.conversationId;
          if (this.conversation && this.conversation.user) {
            this.conversation.user.userAvatar = this.userService.getUserAvatar(
              this.conversation.user,
              this.options['avatar_default_type']
            );
          }
          this.bot = res.bot;
          this.botAvatar = this.botService.getBotAvatar(res.bot);
          this.initialized = true;
          // 快速开始对话时无需请求历史消息
          if (!this.prompt) {
            this.getMessages();
          } else {
            this.messageLoading = false;
            this.sendStreamMessage();
          }
        } else {
          this.messageLoading = false;
          this.botAvatar = this.botService.getBotAvatar();
          this.initGreeting();
        }
      });
  }

  private getMessages() {
    this.messageLoading = true;
    this.botChatService
      .getMessages(this.conversationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.messageLoading = false;
        this.messages = (res || []).map((item) => {
          return {
            messageId: item.messageId,
            content: item.messageContent || this.noneContent,
            html: this.parseMarkdown(item.messageContent || this.noneContent),
            reasoningContent: item.messageReasoningContent || '',
            reasoningHtml: this.parseMarkdown(item.messageReasoningContent || ''),
            role: item.messageRole,
            created: item.messageCreated,
            vote: item.messageVote,
            status: 'done'
          };
        });
        if (this.isChatEnabled && this.messages.length < 1) {
          this.initGreeting();
        }
        this.scrollBottom();
      });
  }

  private getGreeting() {
    if (this.bot?.botGreeting) {
      return this.bot.botGreeting;
    }
    const greeting: string =
      '👋 您好，我是智能阅读助手，可以结合本文（**《$0》**）内容为您解答疑问、提供背景知识和相关延伸信息。欢迎向我提问，一起进行更深入的交流。';
    let title = '';
    if (this.objectType === 'post' && this.post) {
      title = this.post.post.postTitle;
    } else if (this.objectType === 'wallpaper' && this.wallpaper) {
      const lang = this.route.snapshot.queryParams['lang'] || '';
      title =
        lang === 'en'
          ? this.wallpaper.wallpaperCopyrightEn || this.wallpaper.wallpaperCopyright
          : this.wallpaper.wallpaperCopyright || this.wallpaper.wallpaperCopyrightEn;
    }
    if (title) {
      return greeting.replace('$0', title);
    }
    return '👋 您好，我是智能阅读助手，可以结合本文内容为您解答疑问、提供背景知识和相关延伸信息。欢迎向我提问，一起进行更深入的交流。';
  }

  private initGreeting() {
    const greeting = this.getGreeting();

    this.messages.push({
      messageId: generateId(),
      content: greeting,
      html: this.parseMarkdown(greeting),
      role: MessageRole.SYSTEM,
      created: Date.now(),
      vote: 0,
      status: 'done'
    });
  }

  private scrollBottom() {
    const $messageList = this.messageList.nativeElement;
    const { offsetHeight } = $messageList;

    window.setTimeout(() => {
      $messageList.scrollTop = $messageList.scrollHeight - offsetHeight;
    }, 0);
  }

  private updateMessage(msg: ChatEventData) {
    const activeMessage = <ChatMessage>this.messages.at(-1);
    switch (msg.type) {
      case 'done':
        activeMessage.content = activeMessage.content || this.noneContent;
        activeMessage.html = this.parseMarkdown(activeMessage.content);
        activeMessage.status = 'done';
        activeMessage.loading = false;
        this.loading = false;
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
        activeMessage.created = Date.now();
        activeMessage.loading = false;
        this.loading = false;
        this.message.error(msg.message || this.errorMessage);
        this.scrollBottom();
    }
  }

  private parseMarkdown = (msg: string): string => {
    return <string>marked.parse(msg);
  };
}
