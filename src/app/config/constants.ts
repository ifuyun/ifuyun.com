export const SITE_INFO = Object.freeze({
  title: '爱浮云',
  slogan: '心之所向，素履以往',
  url: 'http://www.ifuyun.com',
  domain: 'ifuyun.com',
  author: '抚云',
  startYear: 2014
});
export const POST_SLUG_PREFIX_BLACKLIST = Object.freeze([
  'category',
  'tag',
  'archive',
  'comment',
  'user',
  'wallpaper',
  'admin',
  'api'
]);
export const AVATAR_API_URL = 'https://cravatar.cn/avatar/$0.png?d=$1';
export const ADMIN_URL = '/admin';
export const BLOCK_SCROLL_CLASS = 'cdk-global-scrollblock';

export const STORAGE_KEY_USER = 'user';
export const STORAGE_KEY_VOTED_POSTS = 'voted_posts';
export const STORAGE_KEY_LIKED_COMMENTS = 'liked_comments';
export const STORAGE_KEY_DISLIKED_COMMENTS = 'disliked_comments';
export const STORAGE_KEY_LIKED_WALLPAPER = 'liked_wallpapers';

export const DEFAULT_COPYRIGHT_TYPE = '1';
export const COPYRIGHT_TYPE: Record<string, string> = Object.freeze({
  '0': '禁止转载',
  '1': '转载需授权',
  '2': 'CC: BY-NC-ND'
});
export const COPYRIGHT_TYPE_DESC: Record<string, string> = Object.freeze({
  '0': '禁止转载',
  '1': '转载需授权',
  '2': '自由转载 - 署名 - 非商业性使用 - 禁止演绎'
});
