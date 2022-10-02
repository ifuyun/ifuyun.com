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
export const DEFAULT_COPYRIGHT_TYPE = '1';
export const STORAGE_KEY_USER = 'user';
export const STORAGE_KEY_VOTED_POSTS = 'voted_posts';
export const STORAGE_KEY_LIKED_COMMENTS = 'liked_comments';
export const STORAGE_KEY_DISLIKED_COMMENTS = 'disliked_comments';
export const STORAGE_KEY_LIKED_WALLPAPER = 'liked_wallpapers';
export const AVATAR_API_URL = 'https://cravatar.cn/avatar/$0.png?d=$1';
export const ADMIN_URL = '/admin';
export const THIRD_LOGIN_CALLBACK = '/user/login/callback?from=$0&ref=$1';
export const BING_DOMAIN = 'https://www.bing.com';
export const DEFAULT_WALLPAPER_RESOLUTION = '1920x1080';

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
export const THIRD_LOGIN_API: Record<string, string> = Object.freeze({
  wechat: '',
  qq: '',
  alipay:
    'https://openauth.alipay.com/oauth2/publicAppAuthorize.htm?app_id=$0&scope=auth_user&redirect_uri=$1&state=$2',
  weibo: 'https://api.weibo.com/oauth2/authorize?client_id=$0&response_type=code&redirect_uri=$1',
  github: 'https://github.com/login/oauth/authorize?client_id=$0&redirect_uri=$1&state=$2'
});
export const WALLPAPER_PAGE_KEYWORDS = Object.freeze([
  '高清壁纸',
  '4K 壁纸',
  '壁纸下载',
  '必应壁纸',
  'Bing 壁纸',
  '风景壁纸',
  'Bing wallpaper',
  '手机壁纸'
]);
export const WALLPAPER_PAGE_DESCRIPTION = '高清壁纸频道提供高清壁纸、4K 壁纸、必应壁纸查找、下载。';
