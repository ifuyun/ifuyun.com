export interface BingWallpaperQueryParam {
  size: number;
  offset: number;
  enSearch: number;
  lang: string;
  format: 'js' | 'xml' | 'rss';
  resolution: string;
}

export interface Wallpaper {
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
  fullCopyrightUrl: string;
}
