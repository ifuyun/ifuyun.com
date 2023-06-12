export enum Theme {
  Light = 'light',
  Dark = 'dark'
}

export enum PostType {
  POST = 'post',
  PAGE = 'page',
  PROMPT = 'prompt'
}

export enum TaxonomyType {
  POST = 'post',
  LINK = 'link',
  TAG = 'tag',
  MENU = 'menu',
  PROMPT = 'prompt',
  PROMPT_TAG = 'prompt-tag'
}

export enum TaxonomyStatus {
  PUBLISH = 'publish',
  PRIVATE = 'private',
  TRASH = 'trash'
}

export enum VoteValue {
  LIKE = 'like',
  DISLIKE = 'dislike'
}

export enum VoteType {
  POST = 'post',
  PAGE = 'page',
  PROMPT = 'prompt',
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

export enum SearchType {
  POST = 'post',
  PROMPT = 'prompt',
  WALLPAPER = 'wallpaper'
}
