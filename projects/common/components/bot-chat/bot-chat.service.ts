import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BotMessage, ChatResponse, ChatParam } from './bot-chat.interface';
import { ApiService, ApiUrl, HttpResponseEntity } from 'common/core';

@Injectable({
  providedIn: 'root'
})
export class BotChatService {
  constructor(private apiService: ApiService) {}

  sendMessage(param: ChatParam): Observable<ChatResponse> {
    return this.apiService.httpPost(ApiUrl.CHAT_MESSAGE, param).pipe(map((res) => res?.data || {}));
  }

  getStreamChatUrl() {
    return this.apiService.getApiUrl(ApiUrl.CHAT_STREAM);
  }

  getPostAskUrl() {
    return this.apiService.getApiUrl(ApiUrl.CHAT_POST_ASK);
  }

  getChatUsage(): Observable<{ limit: number; used: number }> {
    return this.apiService.httpGet(ApiUrl.BOT_MESSAGE_USAGE).pipe(map((res) => res?.data || {}));
  }

  getMessages(conversationId: string): Observable<BotMessage[]> {
    return this.apiService.httpGet(ApiUrl.BOT_MESSAGES, { conversationId }).pipe(map((res) => res?.data || []));
  }

  saveMessageVote(payload: { messageId: string; vote: number }): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(ApiUrl.BOT_MESSAGE_VOTE, payload);
  }
}
