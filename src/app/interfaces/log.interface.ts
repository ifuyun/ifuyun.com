import { Theme } from '../config/common.enum';
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
  appId: string;
}

export interface ActionLog {
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
  appId: string;
}
