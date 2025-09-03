import { BotModelStatus, BotModelType, BotProvider, SwitchValue } from 'common/enums';

export interface BotModelEntity {
  botModelId: string;
  botProviderId: string;
  botModelName: string;
  botModelKey: string;
  botModelDescription?: string;
  botModelType: BotModelType;
  botModelInputText?: SwitchValue;
  botModelInputImage?: SwitchValue;
  botModelInputAudio?: SwitchValue;
  botModelInputVideo?: SwitchValue;
  botModelOutputText?: SwitchValue;
  botModelOutputImage?: SwitchValue;
  botModelOutputAudio?: SwitchValue;
  botModelOutputVideo?: SwitchValue;
  botModelMaxContext?: number;
  botModelMaxInput?: number;
  botModelMaxOutput?: number;
  botModelTemperatureMin?: number;
  botModelTemperatureMax?: number;
  botModelTemperatureDefault?: number;
  botModelTopPMin?: number;
  botModelTopPMax?: number;
  botModelTopPDefault?: number;
  botModelFrequencyPenaltyMin?: number;
  botModelFrequencyPenaltyMax?: number;
  botModelFrequencyPenaltyDefault?: number;
  botModelPresencePenaltyMin?: number;
  botModelPresencePenaltyMax?: number;
  botModelPresencePenaltyDefault?: number;
  botModelReleaseDate?: number;
  botModelOrder: number;
  botModelStatus: BotModelStatus;
}

export interface BotModel extends BotModelEntity {
  botModelCreated: number;
  botModelModified: number;
  botProvider: BotProvider;
}
