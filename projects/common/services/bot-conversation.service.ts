import { Injectable } from '@angular/core';
import { ApiService, ApiUrl } from 'common/core';
import { AskAIParam, BotConversationModel } from 'common/interfaces';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BotConversationService {
  constructor(private apiService: ApiService) {}

  getConversation(conversationId: string): Observable<BotConversationModel> {
    return this.apiService.httpGet(ApiUrl.CONVERSATION, { conversationId }).pipe(map((res) => res?.data || {}));
  }

  askAI(param: AskAIParam): Observable<{ conversationId: string }> {
    return this.apiService.httpPost(ApiUrl.CONVERSATION_ASK_AI, param).pipe(map((res) => res?.data || {}));
  }
}
