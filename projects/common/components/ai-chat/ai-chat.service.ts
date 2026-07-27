import { Injectable } from '@angular/core';
import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source';
import { ApiService, ApiUrl, AppConfigService, AuthService, HttpResponseEntity, Message } from 'common/core';
import { ClipboardService } from 'ngx-clipboard';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ICON_COPIED, ICON_COPY } from './ai-chat.constant';
import { BotMessage, ChatChunk, ChatFinish, StreamChatEvent, StreamChatParam } from './ai-chat.interface';

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
    private readonly clipboardService: ClipboardService,
    private readonly appConfigService: AppConfigService
  ) {}

  getPostAskUrl() {
    return this.apiService.getApiUrl(ApiUrl.CHAT_POST_ASK);
  }

  getWallpaperAskUrl() {
    return this.apiService.getApiUrl(ApiUrl.CHAT_WALLPAPER_ASK);
  }

  getChatUsage(): Observable<{ limit: number; used: number }> {
    return this.apiService.httpGet(ApiUrl.BOT_MESSAGE_USAGE).pipe(map((res) => res?.data || {}));
  }

  getMessages(conversationId: string): Observable<BotMessage[]> {
    return this.apiService.httpGet(ApiUrl.BOT_MESSAGES, { conversationId }).pipe(map((res) => res?.data || []));
  }

  streamChat(payload: StreamChatParam, type: 'post' | 'wallpaper') {
    return new Observable<StreamChatEvent>((subscriber) => {
      const { conversationId, message, effort } = payload;
      const chatUrl = type === 'post' ? this.getPostAskUrl() : this.getWallpaperAskUrl();
      const ctrl = new AbortController();

      fetchEventSource(chatUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + this.authService.getToken()
        },
        body: JSON.stringify({
          conversationId,
          message,
          effort,
          appId: this.appConfigService.appId
        }),
        signal: ctrl.signal,
        openWhenHidden: true,
        onopen: async (response) => {
          if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
            return;
          }
          throw new Error(response.status + ': ' + Message.DEFAULT_CHAT_ERROR_MESSAGE);
        },
        onmessage: (msg) => {
          if (msg.event === 'error') {
            let errMsg = '';
            try {
              const errData = JSON.parse(msg.data);
              errMsg = errData.message || Message.DEFAULT_CHAT_ERROR_MESSAGE;
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
              errMsg = Message.DEFAULT_CHAT_ERROR_MESSAGE;
            }
            subscriber.next({
              type: 'error',
              message: errMsg
            });
            ctrl.abort();
          } else if (msg.event === 'data') {
            try {
              if (msg.data) {
                const botMsg: ChatChunk = JSON.parse(msg.data);
                if (botMsg.choices.length > 0) {
                  if (botMsg.choices[0].delta.reasoning_content) {
                    subscriber.next({
                      type: 'thinking',
                      reasoningMessage: botMsg.choices[0].delta.reasoning_content
                    });
                  }
                  if (botMsg.choices[0].delta.content) {
                    subscriber.next({
                      type: 'message',
                      message: botMsg.choices[0].delta.content
                    });
                  }
                }
              }
            } catch (e: any) {
              subscriber.next({
                type: 'error',
                message: e.message || Message.DEFAULT_CHAT_ERROR_MESSAGE
              });
              ctrl.abort();
            }
          } else if (msg.event === 'finish') {
            // finished
            let messageId = '';
            try {
              if (msg.data) {
                const finishMsg: ChatFinish = JSON.parse(msg.data);

                messageId = finishMsg.messageId;
              }
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
              messageId = '';
            }
            subscriber.next({
              type: 'done',
              messageId
            });
            ctrl.abort();
          }
        },
        onerror: (err) => {
          const errMsg = typeof err === 'string' ? err : err?.message || Message.DEFAULT_CHAT_ERROR_MESSAGE;

          subscriber.next({
            type: 'error',
            message: errMsg
          });
          ctrl.abort();

          throw err;
        }
      }).then(() => {
        ctrl.abort();
      });
    });
  }

  copyCode(e: MouseEvent) {
    const $copyBtn = (e.target as HTMLElement).closest('.i-code-copy');
    if ($copyBtn) {
      const $container = $copyBtn.closest('.i-code');
      if ($container) {
        const $code = $container.querySelector('.i-code-html');
        const codeText = $code?.textContent;
        if (codeText) {
          this.clipboardService.copy(codeText);
          $copyBtn.innerHTML = ICON_COPIED;

          setTimeout(() => {
            $copyBtn.innerHTML = ICON_COPY;
          }, 2000);
        }
      }
      e.preventDefault();
      e.stopPropagation();
    }
  }

  saveMessageVote(payload: { messageId: string; vote: number }): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(ApiUrl.BOT_MESSAGE_VOTE, payload);
  }
}
