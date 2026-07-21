import { SearchType } from 'common/enums';
import { Game } from './game';
import { PostVo } from './post';
import { Wallpaper } from './wallpaper';

export interface SearchParam {
  keyword: string;
  page?: number;
  size?: number;
}

export interface PostSearchResponse extends PostVo {
  score: number;
}

export interface WallpaperSearchResponse extends Wallpaper {
  score: number;
}

export interface GameSearchResponse extends Game {
  score: number;
}

export interface AllSearchResponse {
  type: Exclude<SearchType, SearchType.ALL>;
  data: PostVo | Wallpaper | Game;
  score: number;
}
