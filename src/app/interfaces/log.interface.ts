import { UserAgentData } from '../core/common.interface';
import { Action, ActionObjectType } from './log.enum';

export interface AccessLog extends UserAgentData {
  requestUrl: string;
  requestTime?: Date;
  referer: string;
  requestMethod?: string;
  site: 'web' | 'admin';
  userIp?: string;
  resolution: string;
  colorDepth: string;
  isAjax: boolean;
}

export interface ActionLog {
  action: Action;
  objectType: ActionObjectType;
  objectId: string;
  resolution?: string;
  from?: string;
  lang?: string;
  listType?: string;
  keyword?: string;
  theme?: string;
  adsPosition?: string;
  promotionURL?: string;
  goodURL?: string;
  extraData?: Record<string, any>;
}
