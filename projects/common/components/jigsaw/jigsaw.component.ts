import { DatePipe, NgFor, NgIf } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DOCUMENT,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AppConfigService,
  AppDomainConfig,
  COOKIE_KEY_UV_ID,
  DestroyService,
  PlatformService,
  SsrCookieService,
  UserAgentService
} from 'common/core';
import { WallpaperLang } from 'common/enums';
import { Wallpaper } from 'common/interfaces';
import { DurationPipe } from 'common/pipes';
import { UserService, WallpaperJigsawService, WallpaperService } from 'common/services';
import { transformDuration } from 'common/utils';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageService } from 'ng-zorro-antd/image';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { skipWhile, takeUntil } from 'rxjs';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { JigsawCacheService } from './jigsaw-cache.service';
import { GameStatus, JigsawCacheData, JigsawDifficulty, JigsawLog, JigsawPiece } from './jigsaw.interface';
import { JigsawService } from './jigsaw.service';

@Component({
  selector: 'lib-jigsaw',
  imports: [
    NgIf,
    NgFor,
    RouterLink,
    DatePipe,
    DurationPipe,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzDropDownModule,
    NzPopoverModule,
    NzTableModule,
    NzEmptyModule,
    LoginModalComponent
  ],
  providers: [DestroyService, NzImageService, NzModalService],
  templateUrl: './jigsaw.component.html',
  styleUrl: './jigsaw.component.less'
})
export class JigsawComponent implements OnInit, AfterViewInit, OnDestroy {
  // 画布尺寸
  @Input() canvasWidth = 832;
  @Input() canvasHeight = 556;

  @ViewChild('puzzle') puzzleRef!: ElementRef<HTMLElement>;
  @ViewChild('puzzleCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('confirmModalContent') confirmModalContent!: TemplateRef<any>;

  isMobile = false;
  isBrowser = false;
  domains!: AppDomainConfig;
  userId = '';
  faId = '';
  wallpaper?: Wallpaper;
  // 裁剪、缩放后的原始图片
  scaledImage: HTMLImageElement | null = null;
  // 难度级别
  difficultyLevels: Record<number, JigsawDifficulty> = {
    24: { name: '24', rows: 4, cols: 6, pieces: 24, width: 1200 },
    54: { name: '54', rows: 6, cols: 9, pieces: 54, width: 1200 },
    96: { name: '96', rows: 8, cols: 12, pieces: 96, width: 1200 },
    144: { name: '144', rows: 9, cols: 16, pieces: 144, width: 1280 },
    150: { name: '150', rows: 10, cols: 15, pieces: 150, width: 1200 },
    216: { name: '216', rows: 12, cols: 18, pieces: 216, width: 1200 },
    384: { name: '384', rows: 16, cols: 24, pieces: 384, width: 1200 },
    600: { name: '600', rows: 20, cols: 30, pieces: 600, width: 1200 }
  };
  // 当前难度级别
  activeDifficulty: JigsawDifficulty = this.difficultyLevels[54];
  // 游戏状态相关
  gameStatus: GameStatus = 'ready';
  gameTime = 0;
  isFullScreen = false;
  isArranged = false;
  loginVisible = false;
  downloading = false;

  cachedJigsaw: JigsawCacheData | null = null;
  rankings: JigsawLog[] = [];
  rankingLoading = false;

  get difficultyList(): JigsawDifficulty[] {
    return Object.values(this.difficultyLevels);
  }

  get detailLink() {
    if (this.wallpaper) {
      const url = this.domains['wallpaper'].url + '/detail/' + this.wallpaper.wallpaperId;
      const param = this.wallpaper.isCn ? '' : '?lang=' + WallpaperLang.EN;

      return url + param;
    }
    return '';
  }

  get gamePercent() {
    return ((this.gameSteps / (this.jigsawPieces.length - 1)) * 100).toFixed(this.isMobile ? 0 : 1);
  }

  get cacheKey() {
    return 'jigsaw-' + (this.wallpaper?.wallpaperId || '');
  }

  get dateFormat() {
    return this.isMobile ? 'yyyy-MM-dd' : 'yyyy-MM-dd HH:mm';
  }

  private readonly initCanvasWidth = this.canvasWidth;
  private readonly initCanvasHeight = this.canvasHeight;
  // 原图尺寸
  private readonly wallpaperWidth: number;
  private readonly wallpaperHeight: number;
  private readonly wallpaperRatio: number;

  private isSignIn = false;
  private isLoaded = false;
  private bodyOffset = 0;
  private logId = '';
  // 拼图尺寸
  private jigsawWidth = this.activeDifficulty.width;
  private jigsawHeight = (this.activeDifficulty.width * this.activeDifficulty.rows) / this.activeDifficulty.cols;
  // 拼图块数组
  private jigsawPieces: JigsawPiece[] = [];
  private cachedPieces: Record<number, Pick<JigsawPiece, 'displayX' | 'displayY'>> = {};
  // 原始图片
  private originalImage: HTMLImageElement | null = null;
  private seed = Math.floor(Math.random() * 10000); // 随机种子
  // 锯齿参数
  private tabSize = 20; // 锯齿大小百分比 (10-30)
  private jitter = 4; // 锯齿抖动百分比 (0-13)
  // 拖拽相关
  private isDragging = false;
  private selectedPiece: JigsawPiece | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  // 画布拖拽相关
  private isCanvasDragging = false;
  private lastDragX = 0;
  private lastDragY = 0;
  // 拼接相关
  private snapThreshold = 16; // 吸附阈值（像素）
  private connectedGroups: JigsawPiece[][] = []; // 已连接的拼图块组
  // 计时器相关
  private timerInterval: number | null = null; // 计时器
  private lastTimestamp = 0; // 上次更新时间戳
  // 缩放相关
  private zoomScale = 1; // 累积缩放比例
  private zoomStep = 0.1; // 每次缩放步长
  private minZoom = 0.5; // 最小缩放比例
  private maxZoom = 2; // 最大缩放比例
  private gameSteps = 0;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly destroy$: DestroyService,
    private readonly platform: PlatformService,
    private readonly userAgentService: UserAgentService,
    private readonly cookieService: SsrCookieService,
    private readonly appConfigService: AppConfigService,
    private readonly message: NzMessageService,
    private readonly imageService: NzImageService,
    private readonly modal: NzModalService,
    private readonly jigsawService: JigsawService,
    private readonly userService: UserService,
    private readonly wallpaperService: WallpaperService,
    private readonly wallpaperJigsawService: WallpaperJigsawService,
    private readonly jigsawCacheService: JigsawCacheService
  ) {
    this.isMobile = this.userAgentService.isMobile;
    this.isBrowser = this.platform.isBrowser;
    this.domains = this.appConfigService.apps;
    this.wallpaperWidth = this.appConfigService.isDev ? 1920 : 1280;
    this.wallpaperHeight = this.appConfigService.isDev ? 1080 : 720;
    this.wallpaperRatio = this.wallpaperWidth / this.wallpaperHeight;
  }

  ngOnInit() {
    this.faId = this.cookieService.get(COOKIE_KEY_UV_ID);

    this.jigsawService.setSeed(this.seed);
    this.jigsawService.setTabSize(this.tabSize);
    this.jigsawService.setJitter(this.jitter);
    this.initDifficulty();

    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.userId = user.userId || '';
      this.isSignIn = !!user.userId;
    });
    this.wallpaperJigsawService.activeWallpaper$
      .pipe(
        skipWhile((wallpaperId) => !wallpaperId),
        takeUntil(this.destroy$)
      )
      .subscribe((wallpaper) => {
        if (wallpaper) {
          this.wallpaper = wallpaper;
          this.getRankings();

          if (this.isLoaded && this.isBrowser) {
            this.initCanvas();
            this.stopGame(true, false);
            if (this.isFullScreen) {
              this.fullscreen();
            }
            this.loadProgress();
          }
        }
      });
  }

  ngAfterViewInit() {
    this.isLoaded = true;

    if (this.isBrowser) {
      this.initCanvas();
      this.initCanvasEvents();
      this.loadProgress();

      // 添加页面可见性变化监听
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      window.addEventListener('pagehide', this.handleVisibilityChange);
      window.addEventListener('resize', this.handleResize);
    }
  }

  ngOnDestroy() {
    this.document.documentElement.style.position = '';
    this.document.documentElement.style.top = '';

    if (this.isBrowser) {
      // 清除计时器
      this.stopTimer();

      // 移除页面可见性变化监听
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      window.removeEventListener('pagehide', this.handleVisibilityChange);
      window.removeEventListener('resize', this.handleResize);
    }
  }

  initDifficulty() {
    this.jigsawWidth = this.activeDifficulty.width;
    this.jigsawHeight = (this.activeDifficulty.width * this.activeDifficulty.rows) / this.activeDifficulty.cols;
    this.minZoom = (this.activeDifficulty.cols / this.activeDifficulty.width) * 40;
  }

  setDifficulty(difficulty: JigsawDifficulty) {
    if (this.gameStatus === 'playing' || this.gameStatus === 'paused') {
      return;
    }
    if (difficulty.pieces === this.activeDifficulty.pieces) {
      return;
    }
    this.activeDifficulty = difficulty;

    this.initDifficulty();
    this.initCanvas();
    this.getRankings();
  }

  startGame() {
    // 重置游戏状态
    this.isArranged = false;
    this.gameStatus = 'playing';
    this.gameTime = 0;
    this.gameSteps = 0;
    this.zoomScale = 1;

    // 重新生成拼图
    this.initPuzzle();
    this.startTimer();
    this.saveStartLog();
  }

  continueGame() {
    if (this.cachedJigsaw) {
      const isChanged = this.cachedJigsaw.c !== this.activeDifficulty.pieces;
      const lastWidth = this.cachedJigsaw.w || this.canvasWidth;
      const lastHeight = this.cachedJigsaw.h || this.canvasHeight;
      const deltaX = (this.canvasWidth - lastWidth) / 2;
      const deltaY = (this.canvasHeight - lastHeight) / 2;

      this.activeDifficulty = this.difficultyLevels[this.cachedJigsaw.c];
      this.initDifficulty();

      this.gameStatus = 'playing';
      this.logId = this.cachedJigsaw.i;
      this.zoomScale = this.cachedJigsaw.z;
      this.gameTime = this.cachedJigsaw.d;
      this.gameSteps = this.cachedJigsaw.s;
      this.jigsawPieces = this.cachedJigsaw.p.map((item) => ({
        id: item.i,
        row: item.r,
        col: item.c,
        x: item.x,
        y: item.y,
        width: item.w,
        height: item.h,
        displayX: item.dx + deltaX,
        displayY: item.dy + deltaY,
        path: item.p
      }));
      this.connectedGroups = this.cachedJigsaw.g.map((group) => {
        return group.map((g) => this.jigsawPieces.find((p) => p.id === g)!);
      });

      this.startTimer();
      this.renderPuzzle();
      if (isChanged) {
        this.getRankings();
      }
    }
  }

  pauseGame() {
    if (this.gameStatus === 'playing') {
      this.gameStatus = 'paused';

      this.stopTimer();
      // 在暂停状态下显示原始图片
      this.drawOriginalImage();
    }
  }

  resumeGame() {
    if (this.gameStatus === 'paused') {
      this.gameStatus = 'playing';

      this.startTimer();
      this.renderPuzzle();
    }
  }

  restartGame() {
    this.stopTimer();
    this.clearProgress();
    this.startGame();
  }

  stopGame(force = false, drawImage = true) {
    if (this.gameStatus === 'playing' || this.gameStatus === 'paused' || force) {
      // 重置游戏状态
      this.gameStatus = 'ready';
      this.gameTime = 0;
      this.gameSteps = 0;
      this.zoomScale = 1;

      this.stopTimer();
      if (!force) {
        this.clearProgress();
      }
      if (drawImage) {
        // 显示原始图片
        this.drawOriginalImage();
      }
    }
  }

  zoom(isZoomIn = true) {
    if (this.gameStatus !== 'playing' && this.gameStatus !== 'completed') {
      return;
    }
    if ((isZoomIn && this.zoomScale >= this.maxZoom) || (!isZoomIn && this.zoomScale <= this.minZoom)) {
      return;
    }

    const zoomChange = isZoomIn ? this.zoomStep : -this.zoomStep;

    this.zoomScale = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomScale + zoomChange));

    // 重绘拼图
    this.renderPuzzle();
  }

  fullscreen(resize = false) {
    const $puzzle = this.puzzleRef.nativeElement;
    const $canvas = this.canvasRef.nativeElement;
    const lastWidth = this.canvasWidth;
    const lastHeight = this.canvasHeight;

    if (!this.isFullScreen || resize) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const controlHeight = 32;

      this.isFullScreen = true;
      this.bodyOffset = document.documentElement.scrollTop;
      this.canvasWidth = width;
      this.canvasHeight = height - controlHeight;

      document.documentElement.style.position = 'fixed';
      document.documentElement.style.top = `-${this.bodyOffset}px`;

      $puzzle.style.position = 'fixed';
      $puzzle.style.inset = '0';
      $puzzle.style.width = width + 'px';
      $puzzle.style.height = height + 'px';
      $puzzle.style.borderWidth = '0';
      $puzzle.style.zIndex = '99';
    } else {
      this.isFullScreen = false;
      this.canvasWidth = this.initCanvasWidth;
      this.canvasHeight = this.initCanvasHeight;

      document.documentElement.style.position = '';
      document.documentElement.style.top = '';
      requestAnimationFrame(() => {
        window.scrollTo({
          top: this.bodyOffset,
          behavior: 'instant'
        });
      });

      $puzzle.style.position = '';
      $puzzle.style.inset = '';
      $puzzle.style.width = '';
      $puzzle.style.height = '';
      $puzzle.style.borderWidth = '';
      $puzzle.style.zIndex = '';
    }
    $canvas.width = this.canvasWidth;
    $canvas.height = this.canvasHeight;

    const deltaX = (this.canvasWidth - lastWidth) / 2;
    const deltaY = (this.canvasHeight - lastHeight) / 2;

    this.jigsawPieces.forEach((piece) => {
      piece.displayX += deltaX;
      piece.displayY += deltaY;
    });

    if (this.gameStatus === 'ready' || this.gameStatus === 'paused') {
      requestAnimationFrame(() => requestAnimationFrame(() => this.drawOriginalImage()));
    } else {
      requestAnimationFrame(() => requestAnimationFrame(() => this.renderPuzzle()));
    }
  }

  arrange() {
    if (!this.isArranged) {
      this.zoomScale = Math.min(this.zoomScale, 0.5);

      const jw = this.jigsawWidth * this.zoomScale;
      const jh = this.jigsawHeight * this.zoomScale;

      for (const piece of this.jigsawPieces) {
        this.cachedPieces[piece.id] = { displayX: piece.displayX, displayY: piece.displayY };

        const isConnected = !!this.findConnectedGroup(piece);
        if (!isConnected) {
          const pw = piece.width * this.zoomScale;
          const ph = piece.height * this.zoomScale;
          const cx = Math.floor((this.canvasWidth - jw) / 2) - pw;
          const cy = Math.floor((this.canvasHeight - jh) / 2) - ph;
          const cw = this.canvasWidth - pw;
          const ch = this.canvasHeight - ph;
          const { x, y } = this.jigsawService.getRandomPosition(cw, ch, jw + pw, jh + ph, cx, cy);
          const { x: ox, y: oy } = this.jigsawService.getOriginalPosition(
            x,
            y,
            this.canvasWidth,
            this.canvasHeight,
            this.zoomScale
          );

          piece.displayX = ox;
          piece.displayY = oy;
        }
      }
      this.renderPuzzle();
      this.isArranged = true;
    } else {
      for (const piece of this.jigsawPieces) {
        const isConnected = !!this.findConnectedGroup(piece);
        if (!isConnected) {
          piece.displayX = this.cachedPieces[piece.id].displayX;
          piece.displayY = this.cachedPieces[piece.id].displayY;
        }
      }
      this.renderPuzzle();
      this.isArranged = false;
    }
  }

  showFullImage() {
    if (this.scaledImage?.src) {
      this.imageService.preview([
        {
          src: this.scaledImage.src
        }
      ]);
    }
  }

  download(isUhd = false) {
    if (!this.wallpaper || this.downloading) {
      return;
    }
    if (!this.isSignIn && isUhd) {
      this.showLoginModal();
      return;
    }
    this.downloading = true;
    this.wallpaperService
      .getWallpaperDownloadUrl(this.wallpaper.wallpaperId, isUhd ? 1 : 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.downloading = false;
        if (res) {
          window.open(this.appConfigService.apiBase + res);
        }
      });
  }

  showLoginModal() {
    this.loginVisible = true;
  }

  closeLoginModal() {
    this.loginVisible = false;
  }

  private getClipSize(canvas: HTMLCanvasElement) {
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = this.wallpaperWidth;
    let sourceHeight = this.wallpaperHeight;
    const canvasRatio = canvas.width / canvas.height;

    if (this.wallpaperRatio > canvasRatio) {
      // 如果图片比例大于画布比例，需要裁剪图片宽度
      sourceWidth = this.wallpaperHeight * canvasRatio;
      sourceX = (this.wallpaperWidth - sourceWidth) / 2;
    } else {
      // 如果图片比例小于画布比例，需要裁剪图片高度
      sourceHeight = this.wallpaperWidth / canvasRatio;
      sourceY = (this.wallpaperHeight - sourceHeight) / 2;
    }

    return {
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight
    };
  }

  private initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = this.wallpaper!.wallpaperUrl;
    img.onload = () => {
      this.originalImage = img;

      // 创建一个新的画布来存储缩放后的图片
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');

      // 设置临时画布的尺寸为拼图尺寸
      tempCanvas.width = this.jigsawWidth;
      tempCanvas.height = this.jigsawHeight;

      const { sourceWidth, sourceHeight, sourceX, sourceY } = this.getClipSize(tempCanvas);

      if (tempCtx) {
        // 在临时画布上绘制缩放后的图片
        tempCtx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, this.jigsawWidth, this.jigsawHeight);

        // 创建新图片对象并保存缩放后的图片
        const scaledImg = new Image();
        scaledImg.src = tempCanvas.toDataURL();
        scaledImg.onload = () => {
          this.scaledImage = scaledImg;
          this.drawOriginalImage();
        };
      }
    };
    img.onerror = () => {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      ctx.fillStyle = '#ff0000';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('图片加载失败', this.canvasWidth / 2, this.canvasHeight / 2);
    };
  }

  private initCanvasEvents() {
    const canvas = this.canvasRef.nativeElement;
    if (!canvas) {
      return;
    }

    canvas.addEventListener('mousedown', this.handleMouseDown);
    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('mouseup', this.handleMouseUp);
    canvas.addEventListener('mouseleave', this.handleMouseUp);

    // 触摸事件支持
    canvas.addEventListener('touchstart', this.handleTouchStart);
    canvas.addEventListener('touchmove', this.handleTouchMove);
    canvas.addEventListener('touchend', this.handleTouchEnd);

    // 添加鼠标滚轮事件监听
    canvas.addEventListener('wheel', this.handleWheel, { passive: false });
  }

  private initPuzzle() {
    if (this.scaledImage) {
      const canvas = this.canvasRef.nativeElement;
      if (!canvas) {
        return;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        this.createPuzzle(canvas, ctx);
      }
    }
  }

  private createPuzzle(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    // 获取当前难度级别的行列数
    const { rows, cols } = this.activeDifficulty;

    // 设置锯齿参数
    this.jigsawService.setSeed(this.seed);
    this.jigsawService.setTabSize(this.tabSize);
    this.jigsawService.setJitter(this.jitter);

    // 重置缩放比例
    this.zoomScale = 1;

    // 生成拼图块
    this.jigsawPieces = this.jigsawService.generatePuzzlePieces(
      this.canvasWidth,
      this.canvasHeight,
      this.jigsawWidth,
      this.jigsawHeight,
      rows,
      cols
    );

    // 重置连接组
    this.connectedGroups = [];

    // 绘制拼图
    this.renderPuzzle(canvas, ctx);
  }

  private renderPuzzle(canvas?: HTMLCanvasElement, ctx?: CanvasRenderingContext2D) {
    canvas = canvas || this.canvasRef.nativeElement;
    ctx = ctx || (canvas && canvas.getContext('2d')) || undefined;

    if (ctx) {
      this.drawPuzzle(ctx);
    }
  }

  private drawPuzzle(ctx: CanvasRenderingContext2D) {
    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;

    // 清空画布
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    ctx.save();
    // 缩放
    ctx.translate(centerX, centerY);
    ctx.scale(this.zoomScale, this.zoomScale);
    ctx.translate(-centerX, -centerY);

    // 绘制每个拼图块
    this.jigsawPieces.forEach((piece) => {
      const path = new Path2D(piece.path);

      ctx.save();
      // 移动到拼图块的显示位置
      ctx.translate(-piece.x, -piece.y);
      ctx.translate(piece.displayX, piece.displayY);

      // 应用裁剪路径
      ctx.clip(path);
      // 绘制缩放后的图像
      ctx.drawImage(
        this.scaledImage!,
        0,
        0,
        this.jigsawWidth,
        this.jigsawHeight,
        0,
        0,
        this.jigsawWidth,
        this.jigsawHeight
      );
      // 恢复绘图状态
      ctx.restore();

      ctx.save();
      ctx.translate(-piece.x, -piece.y);
      ctx.translate(piece.displayX, piece.displayY);

      // 添加浮雕效果 - 内阴影
      ctx.save();
      ctx.lineWidth = 2 / this.zoomScale;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.stroke(path);
      ctx.restore();

      // 添加浮雕效果 - 外高光
      ctx.save();
      ctx.lineWidth = 1 / this.zoomScale;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      // 创建偏移的路径来模拟高光
      ctx.translate(1 / this.zoomScale, 1 / this.zoomScale);
      ctx.stroke(path);
      ctx.restore();

      // 标准边框
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.lineWidth = 0.5 / this.zoomScale;
      ctx.stroke(path);

      ctx.restore();
    });

    ctx.restore();
  }

  private drawPreviewImage(previewCanvas: HTMLCanvasElement, previewCtx: CanvasRenderingContext2D) {
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    previewCtx.drawImage(
      this.scaledImage!,
      0,
      0,
      this.jigsawWidth,
      this.jigsawHeight,
      0,
      0,
      previewCanvas.width,
      previewCanvas.height
    );
  }

  // 在暂停状态下显示原始图片
  private drawOriginalImage() {
    const canvas = this.canvasRef.nativeElement;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx || !this.originalImage) {
      return;
    }

    const { sourceWidth, sourceHeight, sourceX, sourceY } = this.getClipSize(canvas);

    // 清空画布
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    // 绘制原始图片
    ctx.drawImage(
      this.originalImage,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      this.canvasWidth,
      this.canvasHeight
    );
  }

  // 处理鼠标按下事件
  private handleMouseDown = (e: MouseEvent) => {
    // 只有在游戏进行中才允许拖动拼图块或画布
    if (this.gameStatus !== 'playing' && this.gameStatus !== 'completed') {
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 尝试选择拼图块
    const pieceSelected = this.checkPieceSelection(mouseX, mouseY);

    // 如果没有选中拼图块，则进入画布拖拽模式
    if (!pieceSelected) {
      this.isCanvasDragging = true;
      this.lastDragX = mouseX;
      this.lastDragY = mouseY;
    }
  };

  // 处理鼠标移动事件
  private handleMouseMove = (e: MouseEvent) => {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 拖拽拼图块
    if (this.isDragging && this.selectedPiece) {
      this.dragPiece(mouseX, mouseY);
      return;
    }
    // 拖拽画布
    if (this.isCanvasDragging) {
      this.dragCanvas(mouseX, mouseY);
    }
  };

  // 处理鼠标释放事件
  private handleMouseUp = () => {
    if (this.isDragging && this.selectedPiece) {
      // 在松开鼠标时检查吸附
      const selectedGroup = this.findConnectedGroup(this.selectedPiece);

      this.checkForSnapping(selectedGroup || [this.selectedPiece]);
      // 重绘拼图以显示吸附效果
      this.renderPuzzle();
    }

    // 重置拖拽状态
    this.isDragging = false;
    this.selectedPiece = null;
    this.isCanvasDragging = false;
  };

  // 处理触摸开始事件
  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();

    // 只有在游戏进行中才允许拖动拼图块或画布
    if (this.gameStatus !== 'playing' && this.gameStatus !== 'completed') {
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    // 尝试选择拼图块
    const pieceSelected = this.checkPieceSelection(touchX, touchY);

    // 如果没有选中拼图块，则进入画布拖拽模式
    if (!pieceSelected) {
      this.isCanvasDragging = true;
      this.lastDragX = touchX;
      this.lastDragY = touchY;
    }
  };

  // 处理触摸移动事件
  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    // 拖拽拼图块
    if (this.isDragging && this.selectedPiece) {
      this.dragPiece(touchX, touchY);
      return;
    }
    // 拖拽画布
    if (this.isCanvasDragging) {
      this.dragCanvas(touchX, touchY);
    }
  };

  // 处理触摸结束事件
  private handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();

    if (this.isDragging && this.selectedPiece) {
      // 在触摸结束时检查吸附
      const selectedGroup = this.findConnectedGroup(this.selectedPiece);

      this.checkForSnapping(selectedGroup || [this.selectedPiece]);
      // 重绘拼图以显示吸附效果
      this.renderPuzzle();
    }

    // 重置拖拽状态
    this.isDragging = false;
    this.selectedPiece = null;
    this.isCanvasDragging = false;
  };

  // 处理鼠标滚轮事件
  private handleWheel = (e: WheelEvent) => {
    // 只有在游戏进行中才允许缩放
    if (this.gameStatus !== 'playing' && this.gameStatus !== 'completed') {
      return;
    }

    // 阻止默认滚动行为
    e.preventDefault();

    // 根据滚轮方向决定放大或缩小
    if (e.deltaY < 0) {
      // 向上滚动，放大
      this.zoom();
    } else {
      // 向下滚动，缩小
      this.zoom(false);
    }
  };

  private handleResize = () => {
    if (this.isFullScreen) {
      this.fullscreen(true);
    }
  };

  // 监听页面可见性变化
  private handleVisibilityChange = () => {
    if (document.hidden && this.gameStatus === 'playing') {
      // 页面不可见时暂停游戏
      this.pauseGame();
    }
  };

  // 拖拽画布
  private dragCanvas(x: number, y: number) {
    if (!this.isCanvasDragging) {
      return;
    }

    // 计算拖拽偏移量
    const deltaX = (x - this.lastDragX) / this.zoomScale;
    const deltaY = (y - this.lastDragY) / this.zoomScale;

    // 更新所有拼图块的位置
    this.jigsawPieces.forEach((piece) => {
      piece.displayX += deltaX;
      piece.displayY += deltaY;
    });

    // 更新上次拖拽位置
    this.lastDragX = x;
    this.lastDragY = y;

    // 重绘拼图
    this.renderPuzzle();
  }

  // 拖动拼图块
  private dragPiece(x: number, y: number) {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // 计算缩放后的坐标
    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;
    // 将鼠标坐标转换为缩放前的坐标系
    const scaledX = (x - centerX) / this.zoomScale + centerX;
    const scaledY = (y - centerY) / this.zoomScale + centerY;
    // 计算新位置，考虑缩放因素
    const newX = scaledX - this.dragOffsetX / this.zoomScale;
    const newY = scaledY - this.dragOffsetY / this.zoomScale;
    // 计算移动的偏移量
    const deltaX = (newX - this.selectedPiece!.displayX) * this.zoomScale;
    const deltaY = (newY - this.selectedPiece!.displayY) * this.zoomScale;

    // 找出当前选中拼图块所在的组
    const group = this.findConnectedGroup(this.selectedPiece!);

    // 移动组内所有拼图块
    if (group) {
      group.forEach((piece) => {
        piece.displayX += deltaX;
        piece.displayY += deltaY;
      });
    } else {
      // 如果没有找到组，只移动当前拼图块
      this.selectedPiece!.displayX = newX;
      this.selectedPiece!.displayY = newY;
    }

    // 重绘拼图
    this.renderPuzzle(canvas, ctx);
  }

  // 查找拼图块所在的连接组
  private findConnectedGroup(piece: JigsawPiece): JigsawPiece[] | undefined {
    return this.connectedGroups.find((g) => g.some((i) => i.id === piece.id));
  }

  // 检查是否可以与其他拼图块拼接
  private checkForSnapping(movingPieces: JigsawPiece[]) {
    if (!movingPieces.length) {
      return;
    }

    // 获取当前难度级别的行列数
    const { rows, cols } = this.activeDifficulty;
    const pieceWidth = this.jigsawWidth / cols;
    const pieceHeight = this.jigsawHeight / rows;

    // 根据缩放比例调整吸附阈值
    const adjustedSnapThreshold = this.snapThreshold / this.zoomScale;

    // 遍历所有拼图块，检查是否可以拼接
    const movingIds = movingPieces.map((p) => p.id);

    for (const movingPiece of movingPieces) {
      for (const piece of this.jigsawPieces) {
        // 跳过同一组的拼图块
        if (movingIds.includes(piece.id)) {
          continue;
        }

        // 检查是否是相邻的拼图块
        const isHorizontalNeighbor = Math.abs(movingPiece.col - piece.col) === 1 && movingPiece.row === piece.row;
        const isVerticalNeighbor = Math.abs(movingPiece.row - piece.row) === 1 && movingPiece.col === piece.col;

        if (isHorizontalNeighbor || isVerticalNeighbor) {
          // 计算理想位置（完全拼接时的位置）
          let idealX = 0;
          let idealY = 0;

          if (isHorizontalNeighbor) {
            // 水平相邻
            if (movingPiece.col < piece.col) {
              // 移动的拼图在左边
              idealX = piece.displayX - pieceWidth;
              idealY = piece.displayY;
            } else {
              // 移动的拼图在右边
              idealX = piece.displayX + pieceWidth;
              idealY = piece.displayY;
            }
          } else {
            // 垂直相邻
            if (movingPiece.row < piece.row) {
              // 移动的拼图在上边
              idealX = piece.displayX;
              idealY = piece.displayY - pieceHeight;
            } else {
              // 移动的拼图在下边
              idealX = piece.displayX;
              idealY = piece.displayY + pieceHeight;
            }
          }

          // 计算当前位置与理想位置的距离
          const distance = Math.sqrt(
            Math.pow(movingPiece.displayX - idealX, 2) + Math.pow(movingPiece.displayY - idealY, 2)
          );

          // 如果距离小于调整后的阈值，触发吸附
          if (distance < adjustedSnapThreshold) {
            // 计算需要移动的偏移量
            const offsetX = idealX - movingPiece.displayX;
            const offsetY = idealY - movingPiece.displayY;

            // 移动整个组
            for (const p of movingPieces) {
              p.displayX += offsetX;
              p.displayY += offsetY;
            }

            // 合并两个组
            this.mergeGroups(movingPieces, piece);

            // 只处理一次吸附，避免多次吸附导致位置错误
            return;
          }
        }
      }
    }
  }

  // 合并两个拼图组
  private mergeGroups(movingPieces: JigsawPiece[], targetPiece: JigsawPiece) {
    // 查找目标拼图块所在的组
    const targetGroup = this.findConnectedGroup(targetPiece);
    const movingGroup = this.findConnectedGroup(movingPieces[0]);

    if (targetGroup && movingGroup) {
      // 如果两个组都存在，合并它们
      if (targetGroup !== movingGroup) {
        // 从连接组数组中移除这两个组
        this.connectedGroups = this.connectedGroups.filter((group) => group !== targetGroup && group !== movingGroup);

        // 创建新的合并组
        const mergedGroup = [...targetGroup, ...movingGroup];
        this.connectedGroups.push(mergedGroup);
      }
    } else if (targetGroup) {
      // 如果只有目标组存在，将移动的拼图块添加到目标组
      targetGroup.push(...movingPieces);
    } else if (movingGroup) {
      // 如果只有移动组存在，将目标拼图块添加到移动组
      movingGroup.push(targetPiece);
    } else {
      // 如果两个组都不存在，创建新的组
      this.connectedGroups.push([...movingPieces, targetPiece]);
    }

    this.gameSteps += 1;
    if (this.gameSteps < this.activeDifficulty.pieces - 1) {
      this.saveProgress();
    }

    // 检查是否完成拼图
    this.checkPuzzleCompletion();
  }

  // 检查拼图是否完成
  private checkPuzzleCompletion() {
    // 如果只有一个组且包含所有拼图块，则拼图完成
    if (this.connectedGroups.length === 1 && this.connectedGroups[0].length === this.activeDifficulty.pieces) {
      // 停止计时器
      this.stopTimer();
      this.saveCompleteLog();
      this.clearProgress();
      // 更新游戏状态
      this.gameStatus = 'completed';
      // 显示成功消息
      this.message.success(`恭喜！拼图完成！用时：${transformDuration(this.gameTime)}`);
    }
  }

  // 检查是否选中拼图块
  private checkPieceSelection(x: number, y: number): boolean {
    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) {
      return false;
    }

    // 计算缩放后的坐标
    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;
    // 将鼠标坐标转换为缩放前的坐标系
    const scaledX = (x - centerX) / this.zoomScale + centerX;
    const scaledY = (y - centerY) / this.zoomScale + centerY;

    // 从后向前检查（后绘制的在上层）
    for (let i = this.jigsawPieces.length - 1; i >= 0; i--) {
      const piece = this.jigsawPieces[i];
      // 创建路径并检查点是否在路径内
      const path = new Path2D(piece.path);

      // 使用缩放后的坐标检查点是否在路径内
      if (ctx.isPointInPath(path, scaledX + piece.x - piece.displayX, scaledY + piece.y - piece.displayY)) {
        // 将选中的拼图块及其所在组移到数组末尾（显示在最上层）
        const group = this.findConnectedGroup(piece);

        if (group) {
          // 如果是组的一部分，将整个组移到最上层
          const groupIds = group.map((p) => p.id);
          // 从数组中移除组内所有拼图块
          this.jigsawPieces = this.jigsawPieces.filter((p) => !groupIds.includes(p.id));
          // 将组内所有拼图块添加到数组末尾
          this.jigsawPieces.push(...group);
        } else {
          // 如果不是组的一部分，只移动当前拼图块
          this.jigsawPieces.splice(i, 1);
          this.jigsawPieces.push(piece);
        }

        this.isDragging = true;
        this.selectedPiece = piece;
        // 调整拖拽偏移量，考虑缩放因素
        this.dragOffsetX = (scaledX - piece.displayX) * this.zoomScale;
        this.dragOffsetY = (scaledY - piece.displayY) * this.zoomScale;

        // 重绘拼图
        this.renderPuzzle(this.canvasRef.nativeElement, ctx);

        return true;
      }
    }

    return false;
  }

  // 开始计时器
  private startTimer() {
    if (this.timerInterval) {
      window.clearInterval(this.timerInterval);
    }

    this.lastTimestamp = Date.now();
    this.timerInterval = window.setInterval(() => {
      const now = Date.now();

      this.gameTime += now - this.lastTimestamp;
      this.lastTimestamp = now;

      this.saveProgress();
    }, 1000);
  }

  // 停止计时器
  private stopTimer() {
    if (this.timerInterval) {
      window.clearInterval(this.timerInterval);

      this.timerInterval = null;
    }
  }

  private saveStartLog() {
    this.jigsawService
      .startJigsaw({
        wallpaperId: this.wallpaper?.wallpaperId,
        pieces: this.activeDifficulty.pieces,
        timestamp: Date.now()
      })
      .then((result) => {
        result.pipe(takeUntil(this.destroy$)).subscribe((res) => {
          this.logId = res.logId;
          this.saveProgress();
        });
      });
  }

  private saveCompleteLog() {
    this.jigsawService
      .completeJigsaw({
        logId: this.logId,
        gameTime: this.gameTime,
        timestamp: Date.now()
      })
      .then((result) => {
        result.pipe(takeUntil(this.destroy$)).subscribe(() => {
          this.getRankings();
        });
      });
  }

  private saveProgress() {
    this.jigsawCacheService
      .saveProgress(this.cacheKey, {
        i: this.logId,
        t: Date.now(),
        c: this.activeDifficulty.pieces,
        z: this.zoomScale,
        s: this.gameSteps,
        d: this.gameTime,
        w: this.canvasWidth,
        h: this.canvasHeight,
        p: this.jigsawPieces.map((item) => ({
          i: item.id,
          r: item.row,
          c: item.col,
          x: item.x,
          y: item.y,
          w: item.width,
          h: item.height,
          dx: item.displayX,
          dy: item.displayY,
          p: item.path
        })),
        g: this.connectedGroups.map((group) => group.map((item) => item.id))
      })
      .then(() => {});
  }

  private loadProgress() {
    this.jigsawCacheService.loadProgress(this.cacheKey).then((data) => {
      this.cachedJigsaw = data;

      if (this.cachedJigsaw) {
        this.modal.confirm({
          nzWidth: 500,
          nzTitle: '存在未完成的拼图',
          nzContent: this.confirmModalContent,
          nzOkText: '继续',
          nzCancelText: '开始新游戏',
          nzCentered: true,
          nzDraggable: true,
          nzOnOk: () =>
            new Promise((resolve) => {
              resolve(true);
              this.continueGame();
            }).catch(() => true),
          nzOnCancel: () =>
            new Promise((resolve) => {
              this.clearProgress().then(() => {
                resolve(true);
              });
            }).catch(() => true)
        });
      }
    });
  }

  private clearProgress() {
    return this.jigsawCacheService.clearProgress(this.cacheKey).then(() => {});
  }

  private getRankings() {
    this.rankingLoading = true;
    this.jigsawService
      .getRankings({
        id: this.wallpaper?.wallpaperId || '',
        pieces: this.activeDifficulty.pieces
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.rankingLoading = false;
        this.rankings = res;
      });
  }
}
