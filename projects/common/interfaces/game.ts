import { BreadcrumbEntity, QueryParam, ResultList } from 'common/core';
import { GameLogType, GameVisibility, GameStatus, SwitchValue } from 'common/enums';
import { TagVo } from './tag';
import { CategoryVo } from './category';

export interface GameStatVo {
  viewCount: number;
  playCount: number;
  downloadCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
}

export interface GameEntity {
  id: string;
  name?: string;
  title: string;
  content: string;
  summary: string;
  coverUrl?: string;
  visibility?: GameVisibility;
  status?: GameStatus;
  isPinned?: SwitchValue;
  pinnedAt?: number;
  type: string;
  path: string;
  fileType: string;
  fileSize: number;
  gameStat: GameStatVo;
  createdAt: number;
  updatedAt: number;
}

export interface GameCategoryVo {
  gameId: string;
  sort: number;
  category: CategoryVo;
}

export interface GameTagVo {
  gameId: string;
  sort: number;
  tag: TagVo;
}

export interface Game extends GameEntity {
  categories: GameCategoryVo[];
  tags: GameTagVo[];
  breadcrumbs?: BreadcrumbEntity[];
  isFavorite: boolean;
  isVoted: boolean;
}

export interface GameQueryParam extends QueryParam {
  category?: string;
  tag?: string;
}

export interface GameList {
  games: ResultList<Game>;
  breadcrumbs: BreadcrumbEntity[];
}

export interface GameSearchItem {
  gameId: string;
  title: string;
  coverUrl?: string;
  score: number;
}

export interface GameRelatedParam {
  id: string;
  page?: number;
  size?: number;
}

export interface GameLogEntity {
  gameId: string;
  type: GameLogType;
}

export interface GameCachedItem {
  id: string;
  name: string;
  added: number;
}
