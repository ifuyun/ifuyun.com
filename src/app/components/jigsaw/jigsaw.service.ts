import { Injectable } from '@angular/core';
import { JigsawPiece, JigsawPiecePath } from './jigsaw.interface';

@Injectable({
  providedIn: 'root'
})
export class JigsawService {
  private seed: number = 1;
  private t: number = 0.1; // tabSize / 200.0
  private j: number = 0.04; // jitter / 100.0
  private a: number = 0;
  private b: number = 0;
  private c: number = 0;
  private d: number = 0;
  private e: number = 0;
  private flip: boolean = false;
  private vertical: boolean = false;
  private xi: number = 0;
  private yi: number = 0;
  private xn: number = 0;
  private yn: number = 0;
  private offset: number = 0;
  private width: number = 0;
  private height: number = 0;
  private pw: number = 0;
  private ph: number = 0;
  private pieces: JigsawPiecePath[][] = [];

  constructor() {}

  setSeed(newSeed: number): void {
    this.seed = newSeed;
  }

  setTabSize(tabSize: number): void {
    this.t = tabSize / 200.0;
  }

  setJitter(jitter: number): void {
    this.j = jitter / 100.0;
  }

  setDimensions(width: number, height: number, xn: number, yn: number): void {
    this.width = width;
    this.height = height;
    this.xn = xn;
    this.yn = yn;
    this.pw = width / xn;
    this.ph = height / yn;
    this.offset = 0;
  }

  random(): number {
    const x = Math.sin(this.seed) * 10000;
    this.seed += 1;
    return x - Math.floor(x);
  }

  uniform(min: number, max: number): number {
    const r = this.random();
    return min + r * (max - min);
  }

  rbool(): boolean {
    return this.random() > 0.5;
  }

  first(): void {
    this.e = this.uniform(-this.j, this.j);
    this.next();
  }

  next(): void {
    const lastFlip = this.flip;
    this.flip = this.rbool();
    this.a = this.flip == lastFlip ? -this.e : this.e;
    this.b = this.uniform(-this.j, this.j);
    this.c = this.uniform(-this.j, this.j);
    this.d = this.uniform(-this.j, this.j);
    this.e = this.uniform(-this.j, this.j);
  }

  sl(): number {
    return this.vertical ? this.height / this.yn : this.width / this.xn;
  }

  sw(): number {
    return this.vertical ? this.width / this.xn : this.height / this.yn;
  }

  ol(): number {
    return this.offset + this.sl() * (this.vertical ? this.yi : this.xi);
  }

  ow(): number {
    return this.offset + this.sw() * (this.vertical ? this.xi : this.yi);
  }

  l(v: number): number {
    const ret = this.ol() + this.sl() * v;
    return Math.round(ret * 100) / 100;
  }

  w(v: number): number {
    const ret = this.ow() + this.sw() * v * (this.flip ? -1.0 : 1.0);
    return Math.round(ret * 100) / 100;
  }

  p0l(): number {
    return this.l(0.0);
  }

  p0w(): number {
    return this.w(0.0);
  }

  p1l(): number {
    return this.l(0.2);
  }

  p1w(): number {
    return this.w(this.a);
  }

  p2l(): number {
    return this.l(0.5 + this.b + this.d);
  }

  p2w(): number {
    return this.w(-this.t + this.c);
  }

  p3l(): number {
    return this.l(0.5 - this.t + this.b);
  }

  p3w(): number {
    return this.w(this.t + this.c);
  }

  p4l(): number {
    return this.l(0.5 - 2.0 * this.t + this.b - this.d);
  }

  p4w(): number {
    return this.w(3.0 * this.t + this.c);
  }

  p5l(): number {
    return this.l(0.5 + 2.0 * this.t + this.b - this.d);
  }

  p5w(): number {
    return this.w(3.0 * this.t + this.c);
  }

  p6l(): number {
    return this.l(0.5 + this.t + this.b);
  }

  p6w(): number {
    return this.w(this.t + this.c);
  }

  p7l(): number {
    return this.l(0.5 + this.b + this.d);
  }

  p7w(): number {
    return this.w(-this.t + this.c);
  }

  p8l(): number {
    return this.l(0.8);
  }

  p8w(): number {
    return this.w(this.e);
  }

  p9l(): number {
    return this.l(1.0);
  }

  p9w(): number {
    return this.w(0.0);
  }

  initPieces() {
    for (let i = 0; i < this.yn; i++) {
      this.pieces[i] = [];
      for (let j = 0; j < this.xn; j++) {
        this.pieces[i][j] = {};
      }
    }
  }

  // 生成水平方向的锯齿边缘
  generateHorizontalEdges() {
    this.vertical = false;

    for (this.yi = 1; this.yi < this.yn; ++this.yi) {
      this.xi = 0;
      this.first();

      for (; this.xi < this.xn; ++this.xi) {
        const start = [this.p0l(), this.p0w()];
        const segments = [
          [this.p1l(), this.p1w(), this.p2l(), this.p2w(), this.p3l(), this.p3w()],
          [this.p4l(), this.p4w(), this.p5l(), this.p5w(), this.p6l(), this.p6w()],
          [this.p7l(), this.p7w(), this.p8l(), this.p8w(), this.p9l(), this.p9w()]
        ];

        // 当前行的下边
        this.pieces[this.yi - 1][this.xi].bottom =
          `C ${segments[2][2]} ${segments[2][3]} ${segments[2][0]} ${segments[2][1]} ${segments[1][4]} ${segments[1][5]} ` +
          `C ${segments[1][2]} ${segments[1][3]} ${segments[1][0]} ${segments[1][1]} ${segments[0][4]} ${segments[0][5]} ` +
          `C ${segments[0][2]} ${segments[0][3]} ${segments[0][0]} ${segments[0][1]} ${start[0]} ${start[1]} `;
        // 下一行的上边
        this.pieces[this.yi][this.xi].top =
          `C ${segments[0][0]} ${segments[0][1]} ${segments[0][2]} ${segments[0][3]} ${segments[0][4]} ${segments[0][5]} ` +
          `C ${segments[1][0]} ${segments[1][1]} ${segments[1][2]} ${segments[1][3]} ${segments[1][4]} ${segments[1][5]} ` +
          `C ${segments[2][0]} ${segments[2][1]} ${segments[2][2]} ${segments[2][3]} ${segments[2][4]} ${segments[2][5]} `;
        this.pieces[this.yi][this.xi].x = start[0];
        this.pieces[this.yi][this.xi].y = start[1];

        this.next();
      }
    }
  }

  // 生成垂直方向的锯齿边缘
  generateVerticalEdges() {
    this.vertical = true;

    for (this.xi = 1; this.xi < this.xn; ++this.xi) {
      this.yi = 0;
      this.first();

      for (; this.yi < this.yn; ++this.yi) {
        const start = [this.p0w(), this.p0l()];
        const segments = [
          [this.p1w(), this.p1l(), this.p2w(), this.p2l(), this.p3w(), this.p3l()],
          [this.p4w(), this.p4l(), this.p5w(), this.p5l(), this.p6w(), this.p6l()],
          [this.p7w(), this.p7l(), this.p8w(), this.p8l(), this.p9w(), this.p9l()]
        ];

        // 当前列的右边
        this.pieces[this.yi][this.xi - 1].right =
          `C ${segments[0][0]} ${segments[0][1]} ${segments[0][2]} ${segments[0][3]} ${segments[0][4]} ${segments[0][5]} ` +
          `C ${segments[1][0]} ${segments[1][1]} ${segments[1][2]} ${segments[1][3]} ${segments[1][4]} ${segments[1][5]} ` +
          `C ${segments[2][0]} ${segments[2][1]} ${segments[2][2]} ${segments[2][3]} ${segments[2][4]} ${segments[2][5]} `;
        // 右列的左边
        this.pieces[this.yi][this.xi].left =
          `C ${segments[2][2]} ${segments[2][3]} ${segments[2][0]} ${segments[2][1]} ${segments[1][4]} ${segments[1][5]} ` +
          `C ${segments[1][2]} ${segments[1][3]} ${segments[1][0]} ${segments[1][1]} ${segments[0][4]} ${segments[0][5]} ` +
          `C ${segments[0][2]} ${segments[0][3]} ${segments[0][0]} ${segments[0][1]} ${start[0]} ${start[1]} `;

        this.next();
      }
    }
  }

  // 生成拼图外层边缘
  generateBorderEdges() {
    for (let i = 0; i < this.yn; i++) {
      for (let j = 0; j < this.xn; j++) {
        if (j === 0) {
          this.pieces[i][0].left = `L 0, ${this.ph * i} `;
        } else if (j === this.xn - 1) {
          this.pieces[i][this.xn - 1].right = `L ${this.width}, ${this.ph * (i + 1)} `;
        }
        if (i === 0) {
          this.pieces[0][j].top = `L ${this.pw * (j + 1)}, 0 `;
          this.pieces[0][j].x = this.pw * j;
          this.pieces[0][j].y = 0;
        } else if (i === this.yn - 1) {
          this.pieces[this.yn - 1][j].bottom = `L ${this.pw * j}, ${this.height} `;
        }
      }
    }
  }

  getPiecePath(piece: JigsawPiecePath): string {
    return (
      'M ' +
      (piece.x || 0) +
      ',' +
      (piece.y || 0) +
      ' ' +
      (piece.top || '') +
      (piece.right || '') +
      (piece.bottom || '') +
      (piece.left || '') +
      'Z'
    );
  }

  // 生成拼图块路径
  generatePuzzlePieces(
    canvasWidth: number,
    canvasHeight: number,
    puzzleWidth: number,
    puzzleHeight: number,
    rows: number,
    cols: number
  ): JigsawPiece[] {
    // 设置尺寸和分块数量
    this.setDimensions(puzzleWidth, puzzleHeight, cols, rows);

    // 生成水平和垂直边缘
    this.initPieces();
    this.generateHorizontalEdges();
    this.generateVerticalEdges();
    this.generateBorderEdges();

    const pieces: any[] = [];
    let index = 0;

    // 生成拼图块
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // 计算拼图块在画布中的位置
        const x = col * this.pw;
        const y = row * this.ph;

        // 存储拼图块信息
        pieces.push({
          row,
          col,
          x,
          y,
          width: this.pw,
          height: this.ph,
          displayX: Math.random() * (canvasWidth - 1.6 * this.pw) + 0.3 * this.pw,
          displayY: Math.random() * (canvasHeight - 1.6 * this.ph) + 0.3 * this.ph,
          path: this.getPiecePath(this.pieces[row][col]),
          id: index,
          groupId: index // 初始时每个拼图块自成一组
        });

        index += 1;
      }
    }

    return pieces;
  }
}
