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
  USER_NOT_FOUND = 'User not exist.'
}
