export const DEFAULT_COPYRIGHT_TYPE = '1';
export const STORAGE_USER_KEY = 'user';
export const STORAGE_VOTED_POSTS_KEY = 'voted_posts';
export const STORAGE_LIKED_COMMENTS_KEY = 'liked_comments';
export const STORAGE_DISLIKED_COMMENTS_KEY = 'disliked_comments';
export const AVATAR_API_URL = 'https://cravatar.cn/avatar/$0.png?d=$1';
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
