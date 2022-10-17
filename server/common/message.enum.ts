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
  NOT_FOUND = 'Page not found',
  UNKNOWN_ERROR = 'Unknown error',
  UNAUTHORIZED = 'Unauthorized',
  FORBIDDEN = 'Forbidden',
  BAD_REQUEST = 'Bad request',
  INTERNAL_SERVER_ERROR = 'Request failed, please try again later'
}
