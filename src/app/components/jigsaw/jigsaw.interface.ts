export type GameStatus = 'ready' | 'playing' | 'paused' | 'completed';

export interface JigsawDifficulty {
  rows: number;
  cols: number;
  name: string;
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
