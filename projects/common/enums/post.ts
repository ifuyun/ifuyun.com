export enum ContentType {
  POST = 'post',
  PAGE = 'page'
}

export enum ContentForm {
  ARTICLE = 1,
  STATUS = 2,
  QUOTE = 3,
  NOTE = 4,
  IMAGE = 5,
  VIDEO = 6,
  AUDIO = 7,
  FILE = 8
}

export enum PostLicense {
  PRIVATE = 1,
  COMMERCIAL = 2,
  CC_BY_NC_ND_4_0 = 3,
  CC_BY_NC_SA_4_0 = 4,
  CC_BY_NC_4_0 = 5,
  CC_BY_ND_4_0 = 6,
  CC_BY_SA_4_0 = 7,
  CC_BY_4_0 = 8
}

export enum PostVisibility {
  PUBLIC = 1,
  PRIVATE = 2,
  LOGIN_USER = 3,
  PASSWORD = 4
}

export enum PostCommentStatus {
  OPEN = 1,
  CLOSED = 2,
  AUDIT = 3
}

export enum PostStatus {
  TRASHED = 2,
  PUBLISHED = 5,
  AUDIT = 6,
  REJECT = 7,
  DRAFT = 8,
  AUTO_DRAFT = 9,
  TRASHED_DRAFT = 10,
  OFFLINE = 22
}
