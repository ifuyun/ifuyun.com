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
  ADD_FAVORITE_MUST_LOGIN = '收藏文章请先登录',
  ADD_FAVORITE_SUCCESS = '收藏成功',
  LOGIN_ERROR = '登录失败'
}
