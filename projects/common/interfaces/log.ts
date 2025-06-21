import { ActionObjectType, ActionType, Theme } from 'common/enums';

export interface AccessLog {
  li?: string;
  faId?: string;
  au: string;
  s: 'web' | 'admin';
  rf: string;
  rm?: string;
  rs: string;
  cd: string;
  ia: 0 | 1;
  in: 0 | 1;
  as: number;
  appId: string;
}

export interface LeaveLog {
  logId: string;
  appId: string;
}

export interface ActionLog {
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
  appId: string;
}
