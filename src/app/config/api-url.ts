export enum ApiUrl {
  API_URL_PREFIX = '/api',
  GET_POSTS = '/posts',
  GET_POST_BY_ID = '/posts/:postId',
  GET_POST_BY_PARAM = '/posts/post',
  GET_POSTS_OF_HOT = '/posts/hot',
  GET_POSTS_OF_RANDOM = '/posts/random',
  GET_POSTS_OF_PREV_AND_NEXT = '/posts/prev-and-next',
  GET_POST_ARCHIVES = '/posts/archives',
  GET_OPTIONS = '/options',
  GET_TAXONOMY_TREE = '/taxonomies/taxonomy-tree',
  GET_LINKS_OF_FRIEND = '/links/friend',
  GET_COMMENTS = '/comments',
  SAVE_COMMENTS = '/comments',
  SAVE_VOTES = '/votes',
  LOGIN = '/users/login',
  GET_LOGIN_USER = '/users/login-user',
  CAPTCHA = '/captcha'
}
