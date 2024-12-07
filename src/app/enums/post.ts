export enum PostType {
  POST = 'post',
  PAGE = 'page'
}

export enum PostScope {
  PUBLIC = 'public',
  PASSWORD = 'password',
  PRIVATE = 'private'
}

export enum PostStatus {
  PUBLISH = 'publish',
  PENDING = 'pending',
  REJECT = 'reject',
  DRAFT = 'draft',
  AUTO_DRAFT = 'auto-draft',
  TRASH = 'trash'
}

export enum PostFormat {
  ARTICLE = 'article',
  REVISION = 'revision',
  STATUS = 'status',
  QUOTE = 'quote',
  NOTE = 'note',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file'
}
