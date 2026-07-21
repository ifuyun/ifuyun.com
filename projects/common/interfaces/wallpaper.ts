import { QueryParam } from 'common/core';
import { WallpaperLang } from 'common/enums';

export interface WallpaperQueryParam extends QueryParam {
  lang?: WallpaperLang | WallpaperLang[];
  year?: string;
  month?: string;
  future?: 0 | 1;
}

export interface WallpaperStatVo {
  viewCount: number;
  downloadCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  playCount: number;
}

export interface Wallpaper {
  id: string;
  bingIdPrefix: string;
  bingIdCn: string;
  bingIdEn: string;
  bingDate: Date;
  title: string;
  titleEn: string;
  description?: string;
  caption?: string;
  url: string;
  url2: string;
  thumbUrl: string;
  urlBase: string;
  imageFormat: string;
  quiz: string;
  copyright: string;
  copyrightEn: string;
  copyrightUrl: string;
  copyrightUrlEn: string;
  copyrightAuthor: string;
  storyTitle: string;
  storyTitleEn: string;
  story: string;
  storyEn: string;
  fact: string;
  factEn: string;
  location: string;
  locationEn: string;
  wallpaperStat: WallpaperStatVo;
  updatedAt: number;
  hasTranslation: boolean;
  isCn: boolean;
  isEn: boolean;
  isFavorite: boolean;
  isVoted: boolean;
}

export interface HotWallpaper {
  wallpaperId: string;
  title: string;
  titleCn: string;
  titleEn: string;
  copyright: string;
  copyrightCn: string;
  copyrightEn: string;
  url: string;
  thumbUrl: string;
  score: number;
  isCn: boolean;
  isEn: boolean;
}

export interface PrevAndNextWallpapers {
  prevWallpaper: Wallpaper;
  nextWallpaper: Wallpaper;
}

export interface WallpaperSearchItem {
  wallpaperId: string;
  bingDate: number;
  titleCn: string;
  titleEn: string;
  title: string;
  copyrightCn: string;
  copyrightEn: string;
  copyright: string;
  url: string;
  isCn: boolean;
  isEn: boolean;
  score: number;
}

export interface WallpaperRelatedParam {
  id: string;
  page?: number;
  size?: number;
}
