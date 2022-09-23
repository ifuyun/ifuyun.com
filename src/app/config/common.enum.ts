export enum PostType {
  POST = 'post',
  PAGE = 'page'
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

export enum WallpaperPlatform {
  PC = 'pc',
  MOBILE = 'mobile',
  PAD = 'pad'
}
