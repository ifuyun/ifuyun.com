export enum LlmModelType {
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

export enum LlmModelStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEPRECATED = 'deprecated',
  OFFLINE = 'offline',
  TRASH = 'trash'
}
