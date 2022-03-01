export enum ApiUrl {
  API_URL_PREFIX = '/api',
  GET_POSTS = '/posts',
  GET_POST = '/posts/:postId',
  GET_POST_STANDALONE = '/posts/standalone',
  GET_POSTS_OF_HOT = '/posts/hot',
  GET_POSTS_OF_RANDOM = '/posts/random',
  GET_POSTS_OF_PREV_AND_NEXT = '/posts/prev-and-next',
  GET_POST_ARCHIVE_DATES = '/posts/archive-dates',
  GET_OPTIONS = '/options',
  GET_TAXONOMIES = '/taxonomies',
  GET_LINKS_OF_QUICK = '/links/quick',
  GET_LINKS_OF_FRIEND = '/links/friend',
  GET_COMMENTS = '/comments',
  SAVE_COMMENTS = '/comments',
  SAVE_VOTES = '/votes',
  LOGIN = '/users/login',
  GET_LOGIN_USER = '/users/login-user',
}
