import { QueryParam } from '../../core/common.interface';

export enum WallpaperPlatform {
  PC = 'pc',
  MOBILE = 'mobile',
  PAD = 'pad'
}

export enum BingRequestFormat {
  JS = 'js',
  XML = 'xml',
  RSS = 'rss'
}

export enum WallpaperLang {
  EN = 'en',
  CN = 'cn'
}

export interface WallpaperQueryParam extends QueryParam {
  lang?: WallpaperLang;
}

export interface Wallpaper {
  wallpaperId: string;
  bingIdPrefix: string;
  bingIdCn?: string;
  bingIdEn?: string;
  date: Date;
  title: string;
  titleEn?: string;
  description?: string;
  caption?: string;
  url: string;
  urlBase: string;
  fullUrl: string;
  fullUhdUrl: string;
  imageFormat: string;
  platform: WallpaperPlatform;
  quiz: string;
  copyright: string;
  copyrightEn?: string;
  copyrightLink: string;
  copyrightAuthor: string;
  fullCopyrightUrl: string;
  views: number;
  likes: number;
  downloads: number;
  liked?: boolean;
}

export interface BingWallpaperQueryParam {
  size: number;
  offset: number;
  enSearch: number;
  lang: string;
  format: BingRequestFormat;
  resolution: string;
}
