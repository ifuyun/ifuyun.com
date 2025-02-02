import { GameLogType, GameScope, GameStatus } from '../enums/game';
import { BreadcrumbEntity } from './breadcrumb';
import { QueryParam, ResultList } from './common';
import { TagEntity } from './tag';
import { TaxonomyEntity } from './taxonomy';

export interface GameEntity {
  gameId: string;
  gameName?: string;
  gameTitle: string;
  gameContent: string;
  gameExcerpt: string;
  gameCover: string;
  gameScope?: GameScope;
  gameType: string;
  gamePath?: string;
  gameFileType?: string;
  gameSize?: number;
  gameStatus?: GameStatus;
  gameSticky?: 0 | 1;
  gameStickyTime?: number;
  gameViews: number;
  gamePlays: number;
  gameDownloads: number;
  gameLikes: number;
  gameComments: number;
  gameFavorites: number;
  gameCreated?: number;
  gameModified: number;
}

export interface Game {
  game: GameEntity;
  categories: TaxonomyEntity[];
  tags: TagEntity[];
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
  gameTitle: string;
  gameCover: string;
  score: number;
}

export interface GameRelatedParam {
  gameId: string;
  page?: number;
  size?: number;
}

export interface GameLogEntity {
  gameLogType: GameLogType;
  gameId: string;
}

export interface GameCachedItem {
  id: string;
  name: string;
  added: number;
}
