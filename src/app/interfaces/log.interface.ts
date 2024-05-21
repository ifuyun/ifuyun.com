import { Theme } from '../config/common.enum';
import { AppParam, UserAgentData } from '../core/common.interface';
import { ActionType, ActionObjectType } from './log.enum';

export interface AccessLog extends UserAgentData, AppParam {
  logId: string;
  waId: string;
  accessUrl: string;
  accessTime?: Date;
  site: 'web' | 'admin';
  referrer: string;
  requestMethod?: string;
  userIp?: string;
  resolution: string;
  colorDepth: string;
  isAjax: 0 | 1;
  isNew: 0 | 1;
}

export interface LeaveLog {
  logId: string;
  appId: string;
}

export interface ActionLog extends AppParam {
  waId: string;
  action: ActionType;
  objectType: ActionObjectType;
  objectId?: string;
  ref: string;
  resolution?: string;
  from?: string;
  lang?: string;
  listMode?: string;
  keyword?: string;
  theme?: Theme;
  carouselTitle?: string;
  carouselURL?: string;
  adsPosition?: string;
  goodsURL?: string;
  goodsName?: string;
  extraData?: Record<string, any>;
}
