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

export enum WallpaperListMode {
  LIST = 'list',
  CARD = 'card'
}

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
  wallpaperLikes: number;
  wallpaperDownloads: number;
  wallpaperVoted?: boolean;
  wallpaperModified: Date;
  hasTranslation: boolean;
  isCn: boolean;
  isEn: boolean;
  isFavorite: boolean;
}

export interface HotWallpaper {
  wallpaperId: string;
  wallpaperTitle: string;
  wallpaperTitleCn: string;
  wallpaperTitleEn: string;
  wallpaperCopyright: string;
  wallpaperCopyrightCn: string;
  wallpaperCopyrightEn: string;
  score: number;
  isCn: boolean;
  isEn: boolean;
}
