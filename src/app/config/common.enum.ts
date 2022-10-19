export enum PostType {
  POST = 'post',
  PAGE = 'page'
}

export enum TaxonomyType {
  POST = 'post',
  LINK = 'link',
  TAG = 'tag',
  MENU = 'menu'
}

export enum TaxonomyStatus {
  PUBLISH = 'publish',
  PRIVATE = 'private',
  TRASH = 'trash'
}

export enum CommentFlag {
  OPEN = 'open',
  VERIFY = 'verify',
  CLOSE = 'close'
}

export enum VoteValue {
  LIKE = 'like',
  DISLIKE = 'dislike'
}

export enum VoteType {
  POST = 'post',
  PAGE = 'page',
  COMMENT = 'comment',
  WALLPAPER = 'wallpaper'
}

export enum CopyrightType {
  FORBIDDEN = 0,
  AUTHORIZED = 1,
  CC = 2
}

export enum LinkTarget {
  BLANK = '_blank',
  SELF = '_self',
  TOP = '_top'
}
