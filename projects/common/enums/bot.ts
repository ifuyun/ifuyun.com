export enum BotScope {
  PUBLIC = 'public',
  UNLISTED = 'unlisted',
  PRIVATE = 'private'
}

export enum BotStatus {
  NORMAL = 1,
  TRASHED = 2
}

export enum BotFollowStatus {
  NORMAL = 1,
  TRASHED = 2,
  UNFOLLOWED = 52
}

export enum CloseType {
  CLOSE = 0,
  CLOSE_AND_REFRESH = 1,
  CLOSE_AND_CHAT = 2
}
