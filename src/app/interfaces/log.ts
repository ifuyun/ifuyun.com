import { Theme } from '../enums/common';
import { ActionObjectType, ActionType } from '../enums/log';
import { AppParam } from './common';

export interface UserAgentData {
  os: string;
  osVersion: string;
  architecture: string;
  browser: string;
  browserVersion: string;
  engine: string;
  engineVersion: string;
  isMobile: 0 | 1;
  isCrawler: 0 | 1;
  userAgent: string;
}

export interface AccessLog extends UserAgentData, AppParam {
  logId: string;
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
  index?: number;
  adsPosition?: string;
  goodsURL?: string;
  goodsName?: string;
  ip?: string;
}
