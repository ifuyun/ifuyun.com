import { QueryParam } from '../../core/common.interface';

export enum WallpaperPlatform {
  PC = 'pc',
  MOBILE = 'mobile',
  PAD = 'pad'
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
  titleEn: string;
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
  copyrightEn: string;
  copyrightLink: string;
  copyrightLinkEn: string;
  copyrightAuthor: string;
  fullCopyrightUrl: string;
  story: string;
  storyEn: string;
  views: number;
  likes: number;
  downloads: number;
  liked?: boolean;
  wallpaperModified: Date;
}
