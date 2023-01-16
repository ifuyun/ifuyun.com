export const SITE_INFO = Object.freeze({
  title: '爱浮云',
  slogan: '心之所向，素履以往',
  url: 'http://www.ifuyun.com',
  domain: 'ifuyun.com',
  author: '抚云',
  startYear: 2014
});
export const POST_SLUG_PREFIX_BLACKLIST = Object.freeze([
  'post',
  'category',
  'tag',
  'archive',
  'comment',
  'user',
  'wallpaper',
  'tool',
  'admin',
  'api'
]);
export const ADMIN_URL_PARAM = '?token=$0&expiresAt=$1';
export const LOGO_PATH = '/assets/images/logo.png';
export const LOGO_DARK_PATH = '/assets/images/logo-dark.png';
export const WECHAT_CARD_PATH = '/assets/images/wechat-card.png';
export const AVATAR_API_URL = 'https://cravatar.cn/avatar/$0.png?d=$1';
export const BLOCK_SCROLL_CLASS = 'cdk-global-scrollblock';

export const STORAGE_KEY_USER = 'user';
export const STORAGE_KEY_VOTED_POSTS = 'voted_posts';
export const STORAGE_KEY_LIKED_COMMENTS = 'liked_comments';
export const STORAGE_KEY_DISLIKED_COMMENTS = 'disliked_comments';
export const STORAGE_KEY_LIKED_WALLPAPER = 'liked_wallpapers';
export const STORAGE_KEY_THEME = 'theme';

export const MEDIA_QUERY_THEME_DARK = '(prefers-color-scheme: dark)';
export const MEDIA_QUERY_THEME_LIGHT = '(prefers-color-scheme: light)';
