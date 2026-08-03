import { LogActionType, LogTargetType } from 'common/enums';

export interface AccessLog {
  li?: string;
  faId?: string;
  au: string;
  s: 'web' | 'admin';
  rf: string;
  sw: number | null;
  sh: number | null;
  cd: string;
  ia: 0 | 1;
  in: 0 | 1;
  as: number;
}

export interface ActionLog {
  action: LogActionType;
  targetType: LogTargetType;
  targetId?: string;
  ref: string;
  carouselTitle?: string;
  carouselURL?: string;
  index?: number;
  appId: string;
}
