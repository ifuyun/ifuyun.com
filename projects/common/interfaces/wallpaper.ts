import { QueryParam } from 'common/core';
import { WallpaperLang, WallpaperPlatform } from 'common/enums';

export interface WallpaperQueryParam extends QueryParam {
  lang?: WallpaperLang | WallpaperLang[];
  year?: string;
  month?: string;
  resolution?: string;
}

export interface Wallpaper {
  wallpaperId: string;
  bingIdPrefix: string;
  bingIdCn: string;
  bingIdEn: string;
  wallpaperDate: Date;
  wallpaperTitle: string;
  wallpaperTitleEn: string;
  wallpaperDescription?: string;
  wallpaperCaption?: string;
  wallpaperUrl: string;
  wallpaperUrl2: string;
  wallpaperThumbUrl: string;
  wallpaperUrlBase: string;
  wallpaperImageFormat: string;
  wallpaperPlatform: WallpaperPlatform;
  wallpaperQuiz: string;
  wallpaperCopyright: string;
  wallpaperCopyrightEn: string;
  wallpaperCopyrightLink: string;
  wallpaperCopyrightLinkEn: string;
  wallpaperCopyrightAuthor: string;
  wallpaperStoryTitle: string;
  wallpaperStoryTitleEn: string;
  wallpaperStory: string;
  wallpaperStoryEn: string;
  wallpaperLocation: string;
  wallpaperLocationEn: string;
  wallpaperViews: number;
  wallpaperDownloads: number;
  wallpaperLikes: number;
  wallpaperComments: number;
  wallpaperFavorites: number;
  wallpaperPlays: number;
  wallpaperModified: number;
  hasTranslation: boolean;
  isCn: boolean;
  isEn: boolean;
  isFavorite: boolean;
  isVoted: boolean;
}

export interface HotWallpaper {
  wallpaperId: string;
  wallpaperTitle: string;
  wallpaperTitleCn: string;
  wallpaperTitleEn: string;
  wallpaperCopyright: string;
  wallpaperCopyrightCn: string;
  wallpaperCopyrightEn: string;
  wallpaperUrl: string;
  wallpaperThumbUrl: string;
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
  wallpaperDate: number;
  wallpaperTitleCn: string;
  wallpaperTitleEn: string;
  wallpaperTitle: string;
  wallpaperCopyrightCn: string;
  wallpaperCopyrightEn: string;
  wallpaperCopyright: string;
  wallpaperUrl: string;
  isCn: boolean;
  isEn: boolean;
  score: number;
}

export interface WallpaperRelatedParam {
  wid: string;
  page?: number;
  size?: number;
}
