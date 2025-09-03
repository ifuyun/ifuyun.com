/**
 * messages support placeholder,
 * like:
 *     $0, $1, ..., and so on,
 * it will be replaced with the real value that is passed to the params.
 * Notice:
 *     placeholder starts with 0!
 */
export enum Message {
  // todo: internationalize
  UNKNOWN_ERROR = 'Unknown error',
  ADD_FAVORITE_MUST_LOGIN = '收藏文章或壁纸请先登录',
  ADD_FAVORITE_SUCCESS = '收藏成功',
  VOTE_SUCCESS = '投票成功',
  LOGIN_ERROR = '登录失败',
  ERROR_400 = 'Sorry, the request is invalid.',
  ERROR_403 = 'Sorry, you are not authorized to access this page.',
  ERROR_404 = 'Sorry, the page you visited does not exist.',
  ERROR_500 = 'Sorry, there is an error on server.',
  SEARCH_KEYWORD_IS_NULL = '搜索词不能为空',
  USER_NOT_FOUND = 'User not exist.',
  USER_CHAT_IS_NOT_OWNER = '您不是对话的所有人，不能进行对话',
  USER_CHAT_IS_TRASHED = '对话已被删除，无法进行对话',
  USER_CHAT_BOT_IS_CLOSED = '尚未开通 AI 助手，请联系管理员',
  USER_CHAT_BOT_IS_EXPIRED = 'AI 助手已到期，请联系管理员进行续期',
  USER_CHAT_MODEL_IS_DISABLED = '模型: $0 尚未开通，请联系管理员',
  USER_CHAT_LIMIT_IS_UP = '今日聊天次数已用完，请明日再来'
}
