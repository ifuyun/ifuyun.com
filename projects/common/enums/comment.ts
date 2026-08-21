export enum CommentFlag {
  OPEN = 'open',
  AUDIT = 'audit',
  CLOSED = 'closed'
}

export enum CommentStatus {
  NORMAL = 1,
  TRASHED = 2,
  AUDIT = 6,
  REJECT = 7,
  SPAM = 40
}

export enum CommentTargetType {
  POST = 1,
  PAGE = 2,
  WALLPAPER = 3,
  GAME = 4
}
