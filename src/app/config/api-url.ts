export enum ApiUrl {
  API_URL_PREFIX = '/api',
  // common
  GET_OPTIONS = '/options',
  CAPTCHA = '/captcha',
  // post
  GET_POSTS = '/posts',
  GET_POST = '/posts/post',
  GET_POSTS_OF_HOT = '/posts/hot',
  GET_POSTS_BY_RANDOM = '/posts/random',
  GET_POSTS_OF_PREV_AND_NEXT = '/posts/prev-and-next',
  GET_POST_ARCHIVES = '/posts/archives',
  // taxonomy
  GET_TAXONOMY_TREE = '/taxonomies/taxonomy-tree',
  // link
  GET_LINKS_OF_FOOTER = '/links/footer',
  GET_LINKS_OF_FRIEND = '/links/friend',
  GET_LINKS_OF_FAVORITE = '/links/favorites',
  // comment
  GET_COMMENTS = '/comments',
  SAVE_COMMENT = '/comments/comment',
  // vote
  SAVE_VOTE = '/votes/vote',
  // user
  LOGIN = '/users/login',
  LOGOUT = '/users/logout',
  REGISTER = '/users/register',
  VERIFY_USER = '/users/verify',
  RESEND_CODE = '/users/resend',
  THIRD_LOGIN = '/users/third-login',
  GET_LOGIN_USER = '/users/login-user',
  GET_REGISTER_USER = '/users/register-user',
  // favorite
  ADD_FAVORITE = '/favorites/favorite',
  GET_CAROUSELS = '/options/carousels',
  // log
  SAVE_ACCESS_LOG = '/logs/access',
  SAVE_DOWNLOAD_LOG = '/logs/action',
  // wallpaper
  GET_WALLPAPERS = '/wallpapers',
  GET_WALLPAPERS_BY_RANDOM = '/wallpapers/random',
  GET_WALLPAPERS_OF_PREV_AND_NEXT = '/wallpapers/prev-and-next',
  GET_WALLPAPER_BY_ID = '/wallpapers/wallpaper',
  GET_WALLPAPER_ARCHIVES = '/wallpapers/archives',
  DOWNLOAD_WALLPAPER = '/wallpapers/download',
  // util
  GET_SITEMAP = '/util/sitemap',
  // jd
  GET_JD_SELLING_PROMOTION = '/tool/jd/selling-promotion',
  GET_JD_PROMOTION_COMMON = '/tool/jd/promotion-common',
  GET_JD_GOODS_MATERIAL = '/tool/jd/goods-material',
  GET_JD_GOODS_JINGFEN = '/tool/jd/goods-jingfen',
  // search
  SEARCH_SITE = '/search'
}
