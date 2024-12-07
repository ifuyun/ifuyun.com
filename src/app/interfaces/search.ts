import { SearchType } from '../enums/search';
import { Post } from './post';
import { Wallpaper } from './wallpaper';

export interface SearchParam {
  keyword: string;
  page?: number;
  size?: number;
}

export interface SearchResponse {
  type: SearchType;
  data: Post | Wallpaper;
  score: number;
}
