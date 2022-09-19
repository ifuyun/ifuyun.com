export interface MetaData {
  metaKey: string;
  metaValue: string;
}

export interface IPLocation {
  IP?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionCode?: string;
  city?: string;
  district?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  ISP?: string;
  org?: string;
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

export interface WallpaperQueryParam {
  size: number;
  offset: number;
  ensearch: number;
  lang: string;
  format: 'js' | 'xml' | 'rss';
  resolution: string;
}

export interface Wallpaper {
  title: string;
  desc?: string;
  caption?: string;
  url: string;
  urlbase: string;
  fullUrl: string;
  quiz: string;
  date?: string;
  startdate: string;
  enddate: string;
  copyright: string;
  copyrightlink: string;
  fullCopyrightUrl: string;
  copyrightonly?: string;
  wp: boolean;
}
