export interface PageIndexInfo {
  isHome: boolean;
  isPost: boolean;
  isArticle: boolean;
  isPage: boolean;
  isDetail: boolean;
  isSearch: boolean;
  isAuth: boolean;
  isWallpaper: boolean;
  isJigsaw: boolean;
  isGame: boolean;
  isTool: boolean;
  fullPage: string;
  subPage: string;
}

export interface UserAgentInfo {
  os: string;
  osVersion: string;
  architecture: string;
  browser: string;
  browserVersion: string;
  engine: string;
  engineVersion: string;
  isMobile: boolean;
  isDesktop: boolean;
  isCrawler: boolean;
  userAgent: string;
}

export interface ErrorState {
  code: number;
  message: string;
  visible: boolean;
}

export interface QueryParam {
  page: number;
  size?: number;
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
    list?: ArchiveData[];
    countByYear?: number;
  };
}

export interface ArchiveList {
  dateList: ArchiveDataMap;
  yearList: string[];
}

export interface IPAddress {
  country: string;
  province: string;
  city: string;
  district: string;
}

export interface IPInfo extends IPAddress {
  IP?: number;
  IPStr?: string;
  startIP?: number;
  startIPStr?: string;
  endIP?: number;
  endIPStr?: string;
  isp: string;
}
