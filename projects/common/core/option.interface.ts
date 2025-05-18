import { OptionScope, OptionStatus } from 'common/enums';

export interface OptionEntity {
  [key: string]: string;
}

export interface OptionModel {
  optionId: string;
  optionName: string;
  optionValue: string;
  optionDescription: string;
  optionScope: OptionScope;
  optionSecure: 0 | 1;
  optionOrder: number;
  optionStatus: OptionStatus;
}
