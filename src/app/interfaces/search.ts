import { SearchType } from 'src/app/enums/search';
import { Game } from './game';
import { Post } from './post';
import { Wallpaper } from './wallpaper';

export interface SearchParam {
  keyword: string;
  page?: number;
  size?: number;
}

export interface PostSearchResponse extends Post {
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
  data: Post | Wallpaper | Game;
  score: number;
}
