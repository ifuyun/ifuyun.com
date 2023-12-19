import { Theme } from '../config/common.enum';
import { AppParam, UserAgentData } from '../core/common.interface';
import { Action, ActionObjectType } from './log.enum';

export interface AccessLog extends UserAgentData, AppParam {
  requestUrl: string;
  requestTime?: Date;
  referrer: string;
  requestMethod?: string;
  requestSite: 'web' | 'admin';
  userIp?: string;
  resolution: string;
  colorDepth: string;
  isAjax: boolean;
}

export interface ActionLog extends AppParam {
  action: Action;
  objectType: ActionObjectType;
  objectId?: string;
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
