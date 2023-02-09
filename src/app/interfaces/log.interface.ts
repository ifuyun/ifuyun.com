import { UserAgentData } from '../core/common.interface';
import { DownloadObjectType } from './log.enum';

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

export interface DownloadLog {
  objectType: DownloadObjectType;
  objectId: string;
  resolution?: string;
}
