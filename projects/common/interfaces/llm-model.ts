import { LlmModelStatus, LlmModelType, LlmProvider, SwitchValue } from 'common/enums';

export interface LlmModelEntity {
  llmModelId: string;
  llmProviderId: string;
  llmModelName: string;
  llmModelKey: string;
  llmModelDescription?: string;
  llmModelType: LlmModelType;
  llmModelInputText?: SwitchValue;
  llmModelInputImage?: SwitchValue;
  llmModelInputAudio?: SwitchValue;
  llmModelInputVideo?: SwitchValue;
  llmModelOutputText?: SwitchValue;
  llmModelOutputImage?: SwitchValue;
  llmModelOutputAudio?: SwitchValue;
  llmModelOutputVideo?: SwitchValue;
  llmModelOutputVector?: SwitchValue;
  llmModelMaxContext?: number;
  llmModelMaxInput?: number;
  llmModelMaxOutput?: number;
  llmModelMaxReasoning?: number;
  llmModelMaxDimension?: number;
  llmModelTemperatureMin?: number;
  llmModelTemperatureMax?: number;
  llmModelTemperatureDefault?: number;
  llmModelTopPMin?: number;
  llmModelTopPMax?: number;
  llmModelTopPDefault?: number;
  llmModelFrequencyPenaltyMin?: number;
  llmModelFrequencyPenaltyMax?: number;
  llmModelFrequencyPenaltyDefault?: number;
  llmModelPresencePenaltyMin?: number;
  llmModelPresencePenaltyMax?: number;
  llmModelPresencePenaltyDefault?: number;
  llmModelReleaseDate?: number;
  llmModelOrder: number;
  llmModelStatus: LlmModelStatus;
}

export interface LlmModel extends LlmModelEntity {
  llmModelCreated: number;
  llmModelModified: number;
  llmProvider: LlmProvider;
}
