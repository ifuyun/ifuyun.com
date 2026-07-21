import { LlmModelStatus, LlmModelType, SwitchValue } from 'common/enums';

export interface LlmModelEntity {
  id: string;
  llmProviderId: string;
  name: string;
  displayName: string;
  description?: string;
  type: LlmModelType;
  inputText?: SwitchValue;
  inputImage?: SwitchValue;
  inputAudio?: SwitchValue;
  inputVideo?: SwitchValue;
  outputText?: SwitchValue;
  outputImage?: SwitchValue;
  outputAudio?: SwitchValue;
  outputVideo?: SwitchValue;
  outputVector?: SwitchValue;
  maxContext?: number;
  maxInput?: number;
  maxOutput?: number;
  maxReasoning?: number;
  maxDimension?: number;
  temperatureMin?: number;
  temperatureMax?: number;
  temperatureDefault?: number;
  topPMin?: number;
  topPMax?: number;
  topPDefault?: number;
  frequencyPenaltyMin?: number;
  frequencyPenaltyMax?: number;
  frequencyPenaltyDefault?: number;
  presencePenaltyMin?: number;
  presencePenaltyMax?: number;
  presencePenaltyDefault?: number;
  releaseDate?: number;
  sort: number;
  status: LlmModelStatus;
}

export interface LlmModel extends LlmModelEntity {
  createdAt: number;
  updatedAt: number;
}
