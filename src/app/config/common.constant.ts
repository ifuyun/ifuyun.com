import { environment as env } from '../../environments/environment';

export const APP_ID = env.appId;

export const REGEXP_ID = /^[0-9a-zA-Z]{16}$/i;
export const REGEXP_POST_NAME = /^[a-zA-Z0-9]+(?:[~@$%&*\-_=+;:,]+[a-zA-Z0-9]+)*$/i;

export const POST_SLUG_PREFIX_BLACKLIST = Object.freeze([
  'post',
  'wallpaper',
  'prompt',
  'user',
  'tool',
  'comment',
  'admin',
  'api'
]);

export const PATH_LOGO = '/assets/images/logo.png';
export const PATH_LOGO_DARK = '/assets/images/logo-dark.png';
export const PATH_FAVICON = '/assets/images/favicon.png';
export const PATH_WECHAT_CARD = '/assets/images/wechat-card.png';
export const PATH_WECHAT_MINI_APP_CARD = '/assets/images/wechat-mini.png';
export const PATH_WECHAT_REWARD = '/assets/images/reward.jpg';
export const PATH_RED_PACKET = '/assets/images/red-packet.png';
export const ADMIN_URL_PARAM = '?token=$0&appId=$1';
export const URL_AVATAR_API = 'https://cravatar.cn/avatar/$0.png?d=$1';
export const CLASS_BLOCK_SCROLL = 'cdk-global-scrollblock';

export const STORAGE_KEY_USER = 'user';
export const STORAGE_KEY_VOTED_POSTS = 'voted_posts';
export const STORAGE_KEY_LIKED_COMMENTS = 'liked_comments';
export const STORAGE_KEY_DISLIKED_COMMENTS = 'disliked_comments';
export const STORAGE_KEY_LIKED_WALLPAPER = 'voted_wallpapers';
export const COOKIE_KEY_THEME = 'theme';
export const COOKIE_KEY_UV_ID = 'faid';

export const MEDIA_QUERY_THEME_DARK = '(prefers-color-scheme: dark)';
export const MEDIA_QUERY_THEME_LIGHT = '(prefers-color-scheme: light)';

export const BLANK_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
