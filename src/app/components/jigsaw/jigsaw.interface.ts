import { DBSchema } from 'idb';
import { UserModel } from '../../interfaces/user';

export type GameStatus = 'ready' | 'playing' | 'paused' | 'completed';

export interface JigsawDifficulty {
  name: string;
  rows: number;
  cols: number;
  pieces: number;
  width: number;
}

export interface JigsawPiecePath {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  x?: number;
  y?: number;
}

export interface JigsawPiece {
  id: number;
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
  displayX: number;
  displayY: number;
  path: string;
}

export interface JigsawLogBaseEntity {
  wallpaperId?: string;
  jigsawId?: string;
  timestamp: number;
}

export interface JigsawStartEntity extends JigsawLogBaseEntity {
  pieces: number;
}

export interface JigsawCompleteEntity extends JigsawLogBaseEntity {
  logId: string;
  gameTime: number;
}

export interface JigsawProgressEntity extends JigsawLogBaseEntity {
  logId: string;
  progress: number;
}

export interface JigsawCachePiece {
  i: number;
  r: number;
  c: number;
  x: number;
  y: number;
  w: number;
  h: number;
  dx: number;
  dy: number;
  p: string;
}

export interface JigsawCacheData {
  // log ID
  i: string;
  // timestamp
  t: number;
  // piece count
  c: number;
  // scale
  z: number;
  // progress/steps
  s: number;
  // game time/duration
  d: number;
  // canvas width
  w: number;
  // canvas height
  h: number;
  // pieces
  p: JigsawCachePiece[];
  // groups
  g: number[][];
}

export interface JigsawCacheDB extends DBSchema {
  progress: {
    key: string;
    value: {
      data: string;
      sign: string;
    };
  };
}

export interface JigsawRankParam {
  id: string;
  pieces: number;
  page?: number;
  size?: number;
}

export interface JigsawLog {
  jigsawLogId: string;
  jigsawLogStart: number;
  jigsawLogEnd: number;
  jigsawLogDuration: number;
  wallpaperId?: string;
  jigsawId?: string;
  jigsawLogPieces: number;
  jigsawLogProgress: number;
  userId?: string;
  user?: UserModel;
  faId: string;
}
