export enum BotModelType {
  TEXT_GENERATION = 'text-generation',
  REASONING = 'reasoning',
  TRANSLATION = 'translation',
  IMAGE_GENERATION = 'image-generation',
  VISION = 'vision',
  AUDIO = 'audio',
  MULTI_MODAL = 'multi-modal',
  TEXT_TO_SPEECH = 'text-to-speech',
  SPEECH_RECOGNITION = 'speech-recognition',
  EMBEDDING = 'embedding'
}

export enum BotModelStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEPRECATED = 'deprecated',
  OFFLINE = 'offline',
  TRASH = 'trash'
}
