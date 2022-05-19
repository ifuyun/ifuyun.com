export const DEFAULT_COPYRIGHT_TYPE = '1';
export const STORAGE_USER_KEY = 'user';
export const STORAGE_LIKED_POSTS_KEY = 'liked_posts';
export const STORAGE_LIKED_COMMENT_KEY = 'liked_comments';
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
