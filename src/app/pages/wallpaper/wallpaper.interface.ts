import { WallpaperPlatform } from '../../config/common.enum';

export enum BingRequestFormat {
  JS = 'js',
  XML = 'xml',
  RSS = 'rss'
}

export enum WallpaperLang {
  EN = 'en',
  CN = 'cn'
}

export interface WallpaperQueryParam {
  page: number;
  lang?: WallpaperLang;
  keyword?: string;
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

export interface WallpaperList {
  wallpapers: Wallpaper[];
  page: number;
  total: number;
}

export interface BingWallpaperQueryParam {
  size: number;
  offset: number;
  enSearch: number;
  lang: string;
  format: BingRequestFormat;
  resolution: string;
}

export interface BingWallpaper {
  title: string;
  description?: string;
  caption?: string;
  url: string;
  urlBase: string;
  fullUrl: string;
  quiz: string;
  date?: Date;
  copyright: string;
  copyrightLink: string;
  copyrightAuthor: string;
  fullCopyrightUrl: string;
}
