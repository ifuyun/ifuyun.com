import { SearchType } from '../config/common.enum';
import { Post } from '../pages/post/post.interface';
import { Wallpaper } from '../pages/wallpaper/wallpaper.interface';

export interface AppParam {
  appId: string;
}

export interface PageOptions {
  showHeader: boolean;
  showFooter: boolean;
  showMobileHeader: boolean;
  showMobileFooter: boolean;
}

export interface MetaData {
  metaKey: string;
  metaValue: string;
}

export interface QueryParam extends AppParam {
  page: number;
  pageSize?: number;
  keyword?: string;
  orderBy?: string[][];
}

export interface ResultList<T> {
  list: T[];
  page: number;
  total: number;
}

export interface ArchiveData {
  dateValue: string;
  dateLabel: string;
  count?: number;
}

export interface ArchiveDataMap {
  [year: string]: {
    list: ArchiveData[];
    countByYear: number;
  };
}

export interface ArchiveList {
  dateList: ArchiveDataMap;
  yearList: string[];
}

export interface IpInfo {
  ip: string;
  ipCountry: string;
  ipCountryCode: string | null;
  ipRegion: string;
  ipRegionCode: string | null;
  ipCity: string;
  ipDistrict: string | null;
  ipZipCode: string | null;
  ipLongitude: number | null;
  ipLatitude: number | null;
  ipIsp: string | null;
  ipOrg: string | null;
  ipVersion: 4 | 6;
  ipIsv: string;
}

export interface UserAgentData {
  os: string;
  osVersion: string;
  architecture: string;
  browser: string;
  browserVersion: string;
  engine: string;
  engineVersion: string;
  isMobile: boolean;
  isCrawler: boolean;
  userAgent: string;
}

export interface SearchParam extends AppParam {
  keyword: string;
  page?: number;
  size?: number;
}

export interface SearchResponse {
  type: SearchType;
  data: Post | Wallpaper;
  score: number;
}
