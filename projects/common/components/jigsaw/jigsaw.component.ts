import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  DOCUMENT,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
  TemplateRef,
  viewChild
} from '@angular/core';
import {
  AppConfigService,
  COOKIE_KEY_UV_ID,
  DestroyService,
  PlatformService,
  SsrCookieService,
  UserAgentService
} from 'common/core';
import {
  IconDownloadComponent,
  IconFullscreenComponent,
  IconFullscreenExitComponent,
  IconPlayFillComponent,
  IconStopFillComponent,
  IconTrophyFillComponent
} from 'common/icons';
import { Wallpaper } from 'common/interfaces';
import { DurationPipe } from 'common/pipes';
import { CommonService, UserService, WallpaperJigsawService, WallpaperService } from 'common/services';
import { transformDuration } from 'common/utils';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropdownDirective, NzDropdownMenuComponent } from 'ng-zorro-antd/dropdown';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageService } from 'ng-zorro-antd/image';
import { NzMenuDirective, NzMenuItemComponent } from 'ng-zorro-antd/menu';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { skipWhile, takeUntil } from 'rxjs';
import { JigsawCacheService } from './jigsaw-cache.service';
import { GameStatus, JigsawCacheData, JigsawDifficulty, JigsawLog, JigsawPiece } from './jigsaw.interface';
import { JigsawService } from './jigsaw.service';

@Component({
  selector: 'lib-jigsaw',
  imports: [
    DatePipe,
    DurationPipe,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzDropdownDirective,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzMenuItemComponent,
    NzPopoverModule,
    NzTableModule,
    NzEmptyModule,
    IconPlayFillComponent,
    IconStopFillComponent,
    IconDownloadComponent,
    IconTrophyFillComponent,
    IconFullscreenComponent,
    IconFullscreenExitComponent,
    IconPlayFillComponent,
    IconStopFillComponent,
    IconFullscreenExitComponent,
    IconFullscreenComponent
  ],
  providers: [DestroyService, NzImageService, NzModalService],
  templateUrl: './jigsaw.component.html',
  styleUrl: './jigsaw.component.less'
})
export class JigsawComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly destroy$ = inject(DestroyService);
  private readonly platform = inject(PlatformService);
  private readonly uaService = inject(UserAgentService);
  private readonly commonService = inject(CommonService);
  private readonly cookieService = inject(SsrCookieService);
  private readonly appConfigService = inject(AppConfigService);
  private readonly message = inject(NzMessageService);
  private readonly imageService = inject(NzImageService);
  private readonly modal = inject(NzModalService);
  private readonly jigsawService = inject(JigsawService);
  private readonly userService = inject(UserService);
  private readonly wallpaperService = inject(WallpaperService);
  private readonly wallpaperJigsawService = inject(WallpaperJigsawService);
  private readonly jigsawCacheService = inject(JigsawCacheService);

  // 画布尺寸
  readonly canvasWidthInput = input(832, { alias: 'canvasWidth' });
  readonly canvasHeightInput = input(556, { alias: 'canvasHeight' });

  readonly puzzleRef = viewChild.required<ElementRef<HTMLElement>>('puzzle');
  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('puzzleCanvas');
  readonly confirmModalContent = viewChild<TemplateRef<any>>('confirmModalContent');

  readonly isMobile = this.uaService.isMobile;
  readonly isBrowser = this.platform.isBrowser;
  readonly domains = this.appConfigService.apps;
  readonly userId = signal('');
  readonly faId = this.cookieService.get(COOKIE_KEY_UV_ID);
  readonly wallpaper = signal<Wallpaper | null>(null);
  // 裁剪、缩放后的原始图片
  readonly scaledImage = signal<HTMLImageElement | null>(null);
  // 难度级别
  readonly difficultyLevels: Record<number, JigsawDifficulty> = {
    24: { name: '24', rows: 4, cols: 6, pieces: 24, width: 1200 },
    54: { name: '54', rows: 6, cols: 9, pieces: 54, width: 1200 },
    96: { name: '96', rows: 8, cols: 12, pieces: 96, width: 1200 },
    144: { name: '144', rows: 9, cols: 16, pieces: 144, width: 1280 },
    150: { name: '150', rows: 10, cols: 15, pieces: 150, width: 1200 },
    216: { name: '216', rows: 12, cols: 18, pieces: 216, width: 1200 },
    384: { name: '384', rows: 16, cols: 24, pieces: 384, width: 1200 },
    600: { name: '600', rows: 20, cols: 30, pieces: 600, width: 1200 }
  };
  readonly difficultyList = Object.values(this.difficultyLevels);
  // 当前难度级别
  readonly activeDifficulty = signal(this.difficultyLevels[24]);
  // 游戏状态相关
  readonly gameStatus = signal<GameStatus>('ready');
  readonly gameTime = signal(0);
  readonly isFullScreen = signal(false);
  readonly isArranged = signal(false);
  readonly downloading = signal(false);
  readonly cachedJigsaw = signal<JigsawCacheData | null>(null);
  readonly rankings = signal<JigsawLog[]>([]);
  readonly rankingLoading = signal(false);

  readonly gamePercent = computed(() => {
    const totalSteps = this.activeDifficulty().pieces - 1;
    if (totalSteps <= 0) {
      return this.isMobile ? '0' : '0.0';
    }
    const percent = (this.gameSteps() / totalSteps) * 100;
    if (percent === 0) {
      return '0';
    }
    if (percent === 100) {
      return '100';
    }

    return percent.toFixed(this.isMobile ? 0 : 1);
  });
  readonly cacheKey = computed(() => {
    return 'jigsaw-' + (this.wallpaper()?.id || '');
  });
  readonly dateFormat = this.isMobile ? 'yyyy-MM-dd' : 'yyyy-MM-dd HH:mm';
  readonly canvasWidth = computed(() => {
    return this.fullscreenCanvasSize()?.width ?? this.canvasWidthInput();
  });
  readonly canvasHeight = computed(() => {
    return this.fullscreenCanvasSize()?.height ?? this.canvasHeightInput();
  });

  // 原图尺寸
  private readonly wallpaperWidth = this.appConfigService.isDev ? 1920 : 1280;
  private readonly wallpaperHeight = this.appConfigService.isDev ? 1080 : 720;
  private readonly wallpaperRatio = this.wallpaperWidth / this.wallpaperHeight;

  private readonly isSignIn = signal(false);
  private readonly isLoaded = signal(false);
  private readonly bodyOffset = signal(0);
  private readonly logId = signal('');
  // 拼图尺寸
  private readonly jigsawWidth = computed(() => this.activeDifficulty().width);
  private readonly jigsawHeight = computed(() => {
    const difficulty = this.activeDifficulty();
    return (difficulty.width * difficulty.rows) / difficulty.cols;
  });
  // 拼图块数组
  private readonly jigsawPieces = signal<JigsawPiece[]>([]);
  private readonly cachedPieces = signal<Record<number, Pick<JigsawPiece, 'displayX' | 'displayY'>>>({});
  // 原始图片
  private readonly originalImage = signal<HTMLImageElement | null>(null);
  // 锯齿参数
  private readonly tabSize = 20; // 锯齿大小百分比 (10-30)
  private readonly jitter = 4; // 锯齿抖动百分比 (0-13)
  // 拖拽相关
  private readonly isDragging = signal(false);
  private readonly selectedPiece = signal<JigsawPiece | null>(null);
  private readonly dragOffsetX = signal(0);
  private readonly dragOffsetY = signal(0);
  // 画布拖拽相关
  private readonly isCanvasDragging = signal(false);
  private readonly lastDragX = signal(0);
  private readonly lastDragY = signal(0);
  // 拼接相关
  private readonly snapThreshold = 16; // 吸附阈值（像素）
  private readonly connectedGroups = signal<number[][]>([]); // 已连接的拼图块组
  // 计时器相关
  private readonly timerInterval = signal<number | null>(null); // 计时器
  private readonly lastTimestamp = signal(0); // 上次更新时间戳
  // 缩放相关
  private readonly fullscreenCanvasSize = signal<{ width: number; height: number } | null>(null);
  private readonly zoomScale = signal(1); // 累积缩放比例
  private readonly zoomStep = 0.1; // 每次缩放步长
  private readonly minZoom = computed(() => {
    const difficulty = this.activeDifficulty();
    return (difficulty.cols / difficulty.width) * 40;
  });
  private readonly maxZoom = 2; // 最大缩放比例
  private readonly gameSteps = signal(0);

  ngOnInit() {
    this.jigsawService.setSeed(this.generateSeed());
    this.jigsawService.setTabSize(this.tabSize);
    this.jigsawService.setJitter(this.jitter);

    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.userId.set(user.id || '');
      this.isSignIn.set(!!user.id);
    });
    this.wallpaperJigsawService.activeJigsawWallpaper$
      .pipe(
        skipWhile((id) => !id),
        takeUntil(this.destroy$)
      )
      .subscribe((wallpaper) => {
        if (wallpaper) {
          this.wallpaper.set(wallpaper);
          this.getRankings();

          if (this.isLoaded() && this.isBrowser) {
            this.initCanvas();
            this.stopGame(true, false);
            if (this.isFullScreen()) {
              this.fullscreen();
            }
            this.loadProgress();
          }
        }
      });
  }

  ngAfterViewInit() {
    this.isLoaded.set(true);

    if (this.isBrowser) {
      this.initCanvas();
      this.initCanvasEvents();
      this.loadProgress();

      // 添加页面可见性变化监听
      this.document.addEventListener('visibilitychange', this.handleVisibilityChange);
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
      this.document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      window.removeEventListener('pagehide', this.handleVisibilityChange);
      window.removeEventListener('resize', this.handleResize);
    }
  }

  setDifficulty(difficulty: JigsawDifficulty) {
    if (this.gameStatus() === 'playing' || this.gameStatus() === 'paused') {
      return;
    }
    if (difficulty.pieces === this.activeDifficulty().pieces) {
      return;
    }
    this.activeDifficulty.set(difficulty);
    this.gameStatus.set('ready');
    this.gameTime.set(0);
    this.gameSteps.set(0);
    this.zoomScale.set(1);

    this.initCanvas();
    this.getRankings();
  }

  startGame() {
    // 重置游戏状态
    this.isArranged.set(false);
    this.gameStatus.set('playing');
    this.gameTime.set(0);
    this.gameSteps.set(0);
    this.zoomScale.set(1);

    // 重新生成拼图
    this.initPuzzle();
    this.arrange();
    this.startTimer();
    this.saveStartLog();
  }

  continueGame() {
    const cachedJigsaw = this.cachedJigsaw();
    if (cachedJigsaw) {
      const isChanged = cachedJigsaw.c !== this.activeDifficulty().pieces;
      const lastWidth = cachedJigsaw.w || this.canvasWidth();
      const lastHeight = cachedJigsaw.h || this.canvasHeight();
      const deltaX = (this.canvasWidth() - lastWidth) / 2;
      const deltaY = (this.canvasHeight() - lastHeight) / 2;

      this.activeDifficulty.set(this.difficultyLevels[cachedJigsaw.c]);

      this.gameStatus.set('playing');
      this.logId.set(cachedJigsaw.i);
      this.zoomScale.set(cachedJigsaw.z);
      this.gameTime.set(cachedJigsaw.d);
      this.gameSteps.set(cachedJigsaw.s);
      this.jigsawPieces.set(
        cachedJigsaw.p.map((item) => ({
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
        }))
      );
      this.connectedGroups.set(cachedJigsaw.g.map((group) => [...group]));

      this.startTimer();
      this.renderPuzzle();
      if (isChanged) {
        this.getRankings();
      }
    }
  }

  pauseGame() {
    if (this.gameStatus() === 'playing') {
      this.gameStatus.set('paused');

      this.stopTimer();
      // 在暂停状态下显示原始图片
      this.drawOriginalImage();
    }
  }

  resumeGame() {
    if (this.gameStatus() === 'paused') {
      this.gameStatus.set('playing');

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
    if (this.gameStatus() === 'playing' || this.gameStatus() === 'paused' || force) {
      // 重置游戏状态
      this.gameStatus.set('ready');
      this.gameTime.set(0);
      this.gameSteps.set(0);
      this.zoomScale.set(1);

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
    if (this.gameStatus() !== 'playing' && this.gameStatus() !== 'completed') {
      return;
    }
    const zoomScale = this.zoomScale();
    if ((isZoomIn && zoomScale >= this.maxZoom) || (!isZoomIn && zoomScale <= this.minZoom())) {
      return;
    }

    const zoomChange = isZoomIn ? this.zoomStep : -this.zoomStep;

    this.zoomScale.set(Math.max(this.minZoom(), Math.min(this.maxZoom, zoomScale + zoomChange)));

    // 重绘拼图
    this.renderPuzzle();
  }

  fullscreen(resize = false) {
    const $puzzle = this.puzzleRef().nativeElement;
    const $canvas = this.canvasRef().nativeElement;
    const lastWidth = this.canvasWidth();
    const lastHeight = this.canvasHeight();

    if (!this.isFullScreen() || resize) {
      // 需要去除滚动条宽高
      const width = this.document.body.clientWidth;
      const height = this.document.body.clientHeight;
      const controlHeight = 32;

      this.isFullScreen.set(true);
      this.bodyOffset.set(this.document.documentElement.scrollTop);
      this.fullscreenCanvasSize.set({ width, height: height - controlHeight });

      this.document.documentElement.style.position = 'fixed';
      this.document.documentElement.style.top = `-${this.bodyOffset()}px`;

      $puzzle.style.position = 'fixed';
      $puzzle.style.inset = '0';
      $puzzle.style.width = width + 'px';
      $puzzle.style.height = height + 'px';
      $puzzle.style.borderWidth = '0';
      $puzzle.style.zIndex = '99';
    } else {
      this.isFullScreen.set(false);
      this.fullscreenCanvasSize.set(null);

      this.document.documentElement.style.position = '';
      this.document.documentElement.style.top = '';
      requestAnimationFrame(() => {
        window.scrollTo({
          top: this.bodyOffset(),
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
    $canvas.width = this.canvasWidth();
    $canvas.height = this.canvasHeight();

    const deltaX = (this.canvasWidth() - lastWidth) / 2;
    const deltaY = (this.canvasHeight() - lastHeight) / 2;

    this.jigsawPieces.update((pieces) => {
      return pieces.map((piece) => ({
        ...piece,
        displayX: piece.displayX + deltaX,
        displayY: piece.displayY + deltaY
      }));
    });

    if (this.gameStatus() === 'ready' || this.gameStatus() === 'paused') {
      requestAnimationFrame(() => requestAnimationFrame(() => this.drawOriginalImage()));
    } else {
      requestAnimationFrame(() => requestAnimationFrame(() => this.renderPuzzle()));
    }
  }

  arrange() {
    if (!this.isArranged()) {
      this.zoomScale.update((zoomScale) => Math.min(zoomScale, 0.5));

      const zoomScale = this.zoomScale();
      const jw = this.jigsawWidth() * zoomScale;
      const jh = this.jigsawHeight() * zoomScale;
      const cachedPieces: Record<number, Pick<JigsawPiece, 'displayX' | 'displayY'>> = {};

      this.jigsawPieces.update((pieces) => {
        return pieces.map((piece) => {
          cachedPieces[piece.id] = { displayX: piece.displayX, displayY: piece.displayY };

          const isConnected = !!this.findConnectedGroup(piece);
          if (!isConnected) {
            const pw = piece.width * zoomScale;
            const ph = piece.height * zoomScale;
            const cx = Math.floor((this.canvasWidth() - jw) / 2) - pw;
            const cy = Math.floor((this.canvasHeight() - jh) / 2) - ph;
            const cw = this.canvasWidth() - pw;
            const ch = this.canvasHeight() - ph;
            const { x, y } = this.jigsawService.getRandomPosition(cw, ch, jw + pw, jh + ph, cx, cy);
            const { x: ox, y: oy } = this.jigsawService.getOriginalPosition(
              x,
              y,
              this.canvasWidth(),
              this.canvasHeight(),
              zoomScale
            );

            return {
              ...piece,
              displayX: ox,
              displayY: oy
            };
          }

          return piece;
        });
      });
      this.cachedPieces.set(cachedPieces);
      this.renderPuzzle();
      this.isArranged.set(true);
    } else {
      const cachedPieces = this.cachedPieces();

      this.jigsawPieces.update((pieces) => {
        return pieces.map((piece) => {
          const isConnected = !!this.findConnectedGroup(piece);
          if (!isConnected && cachedPieces[piece.id]) {
            return {
              ...piece,
              displayX: cachedPieces[piece.id].displayX,
              displayY: cachedPieces[piece.id].displayY
            };
          }

          return piece;
        });
      });
      this.renderPuzzle();
      this.isArranged.set(false);
    }
  }

  showFullImage() {
    const scaledImage = this.scaledImage();
    if (scaledImage?.src) {
      this.imageService.preview([
        {
          src: scaledImage.src
        }
      ]);
    }
  }

  download(isUhd = false) {
    const wallpaper = this.wallpaper();
    if (!wallpaper || this.downloading()) {
      return;
    }
    if (!this.isSignIn() && isUhd) {
      this.showSigninModal();
      return;
    }
    this.downloading.set(true);
    this.wallpaperService
      .getWallpaperDownloadUrl(wallpaper.id, isUhd ? 1 : 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.downloading.set(false);
        if (res) {
          window.open(this.appConfigService.apiBase + res);
        }
      });
  }

  showSigninModal() {
    this.commonService.updateSigninOptions({
      visible: true,
      closable: true
    });
  }

  private generateSeed() {
    return Math.floor(Math.random() * 10000);
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
    const canvas = this.canvasRef().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = this.wallpaper()!.url;
    img.onload = () => {
      this.originalImage.set(img);

      // 创建一个新的画布来存储缩放后的图片
      const tempCanvas = this.document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');

      // 设置临时画布的尺寸为拼图尺寸
      tempCanvas.width = this.jigsawWidth();
      tempCanvas.height = this.jigsawHeight();

      const { sourceWidth, sourceHeight, sourceX, sourceY } = this.getClipSize(tempCanvas);

      if (tempCtx) {
        // 在临时画布上绘制缩放后的图片
        tempCtx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          this.jigsawWidth(),
          this.jigsawHeight()
        );

        // 创建新图片对象并保存缩放后的图片
        const scaledImg = new Image();
        scaledImg.src = tempCanvas.toDataURL();
        scaledImg.onload = () => {
          this.scaledImage.set(scaledImg);
          this.drawOriginalImage();
        };
      }
    };
    img.onerror = () => {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, this.canvasWidth(), this.canvasHeight());
      ctx.fillStyle = '#ff0000';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('图片加载失败', this.canvasWidth() / 2, this.canvasHeight() / 2);
    };
  }

  private initCanvasEvents() {
    const canvas = this.canvasRef().nativeElement;

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
    if (this.scaledImage()) {
      const canvas = this.canvasRef().nativeElement;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        this.createPuzzle(canvas, ctx);
      }
    }
  }

  private createPuzzle(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    // 获取当前难度级别的行列数
    const { rows, cols } = this.activeDifficulty();

    // 设置锯齿参数
    this.jigsawService.setSeed(this.generateSeed());
    this.jigsawService.setTabSize(this.tabSize);
    this.jigsawService.setJitter(this.jitter);

    // 生成拼图块
    this.jigsawPieces.set(
      this.jigsawService.generatePuzzlePieces(
        this.canvasWidth(),
        this.canvasHeight(),
        this.jigsawWidth(),
        this.jigsawHeight(),
        rows,
        cols
      )
    );

    // 重置连接组
    this.connectedGroups.set([]);
    this.cachedPieces.set({});

    // 绘制拼图
    this.renderPuzzle(canvas, ctx);
  }

  private renderPuzzle(canvas?: HTMLCanvasElement, ctx?: CanvasRenderingContext2D) {
    canvas = canvas || this.canvasRef().nativeElement;
    ctx = ctx || (canvas && canvas.getContext('2d')) || undefined;

    if (ctx) {
      this.drawPuzzle(ctx);
    }
  }

  private drawPuzzle(ctx: CanvasRenderingContext2D) {
    const centerX = this.canvasWidth() / 2;
    const centerY = this.canvasHeight() / 2;

    // 清空画布
    ctx.clearRect(0, 0, this.canvasWidth(), this.canvasHeight());
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, this.canvasWidth(), this.canvasHeight());
    ctx.save();
    // 缩放
    ctx.translate(centerX, centerY);
    ctx.scale(this.zoomScale(), this.zoomScale());
    ctx.translate(-centerX, -centerY);

    // 绘制每个拼图块
    this.jigsawPieces().forEach((piece) => {
      const path = new Path2D(piece.path);

      ctx.save();
      // 移动到拼图块的显示位置
      ctx.translate(-piece.x, -piece.y);
      ctx.translate(piece.displayX, piece.displayY);

      // 应用裁剪路径
      ctx.clip(path);
      // 绘制缩放后的图像
      ctx.drawImage(
        this.scaledImage()!,
        0,
        0,
        this.jigsawWidth(),
        this.jigsawHeight(),
        0,
        0,
        this.jigsawWidth(),
        this.jigsawHeight()
      );
      // 恢复绘图状态
      ctx.restore();

      ctx.save();
      ctx.translate(-piece.x, -piece.y);
      ctx.translate(piece.displayX, piece.displayY);

      // 添加浮雕效果 - 内阴影
      ctx.save();
      ctx.lineWidth = 2 / this.zoomScale();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.stroke(path);
      ctx.restore();

      // 添加浮雕效果 - 外高光
      ctx.save();
      ctx.lineWidth = 1 / this.zoomScale();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      // 创建偏移的路径来模拟高光
      ctx.translate(1 / this.zoomScale(), 1 / this.zoomScale());
      ctx.stroke(path);
      ctx.restore();

      // 标准边框
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.lineWidth = 0.5 / this.zoomScale();
      ctx.stroke(path);

      ctx.restore();
    });

    ctx.restore();
  }

  private drawPreviewImage(previewCanvas: HTMLCanvasElement, previewCtx: CanvasRenderingContext2D) {
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    previewCtx.drawImage(
      this.scaledImage()!,
      0,
      0,
      this.jigsawWidth(),
      this.jigsawHeight(),
      0,
      0,
      previewCanvas.width,
      previewCanvas.height
    );
  }

  // 在暂停状态下显示原始图片
  private drawOriginalImage() {
    const canvas = this.canvasRef().nativeElement;
    const ctx = canvas.getContext('2d');
    const originalImage = this.originalImage();
    if (!ctx || !originalImage) {
      return;
    }

    const { sourceWidth, sourceHeight, sourceX, sourceY } = this.getClipSize(canvas);

    // 清空画布
    ctx.clearRect(0, 0, this.canvasWidth(), this.canvasHeight());
    // 绘制原始图片
    ctx.drawImage(
      originalImage,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      this.canvasWidth(),
      this.canvasHeight()
    );
  }

  // 处理鼠标按下事件
  private handleMouseDown = (e: MouseEvent) => {
    // 只有在游戏进行中才允许拖动拼图块或画布
    if (this.gameStatus() !== 'playing' && this.gameStatus() !== 'completed') {
      return;
    }

    const canvas = this.canvasRef().nativeElement;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 尝试选择拼图块
    const pieceSelected = this.checkPieceSelection(mouseX, mouseY);

    // 如果没有选中拼图块，则进入画布拖拽模式
    if (!pieceSelected) {
      this.isCanvasDragging.set(true);
      this.lastDragX.set(mouseX);
      this.lastDragY.set(mouseY);
    }
  };

  // 处理鼠标移动事件
  private handleMouseMove = (e: MouseEvent) => {
    const canvas = this.canvasRef().nativeElement;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 拖拽拼图块
    if (this.isDragging() && this.selectedPiece()) {
      this.dragPiece(mouseX, mouseY);
      return;
    }
    // 拖拽画布
    if (this.isCanvasDragging()) {
      this.dragCanvas(mouseX, mouseY);
    }
  };

  // 处理鼠标释放事件
  private handleMouseUp = () => {
    const selectedPiece = this.selectedPiece();
    if (this.isDragging() && selectedPiece) {
      // 在松开鼠标时检查吸附
      const selectedGroup = this.findConnectedGroup(selectedPiece);

      this.checkForSnapping(selectedGroup || [selectedPiece]);
      // 重绘拼图以显示吸附效果
      this.renderPuzzle();
    }

    // 重置拖拽状态
    this.isDragging.set(false);
    this.selectedPiece.set(null);
    this.isCanvasDragging.set(false);
  };

  // 处理触摸开始事件
  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();

    // 只有在游戏进行中才允许拖动拼图块或画布
    if (this.gameStatus() !== 'playing' && this.gameStatus() !== 'completed') {
      return;
    }

    const canvas = this.canvasRef().nativeElement;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    // 尝试选择拼图块
    const pieceSelected = this.checkPieceSelection(touchX, touchY);

    // 如果没有选中拼图块，则进入画布拖拽模式
    if (!pieceSelected) {
      this.isCanvasDragging.set(true);
      this.lastDragX.set(touchX);
      this.lastDragY.set(touchY);
    }
  };

  // 处理触摸移动事件
  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();

    const canvas = this.canvasRef().nativeElement;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    // 拖拽拼图块
    if (this.isDragging() && this.selectedPiece()) {
      this.dragPiece(touchX, touchY);
      return;
    }
    // 拖拽画布
    if (this.isCanvasDragging()) {
      this.dragCanvas(touchX, touchY);
    }
  };

  // 处理触摸结束事件
  private handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();

    const selectedPiece = this.selectedPiece();
    if (this.isDragging() && selectedPiece) {
      // 在触摸结束时检查吸附
      const selectedGroup = this.findConnectedGroup(selectedPiece);

      this.checkForSnapping(selectedGroup || [selectedPiece]);
      // 重绘拼图以显示吸附效果
      this.renderPuzzle();
    }

    // 重置拖拽状态
    this.isDragging.set(false);
    this.selectedPiece.set(null);
    this.isCanvasDragging.set(false);
  };

  // 处理鼠标滚轮事件
  private handleWheel = (e: WheelEvent) => {
    // 只有在游戏进行中才允许缩放
    if (this.gameStatus() !== 'playing' && this.gameStatus() !== 'completed') {
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
    if (this.isFullScreen()) {
      this.fullscreen(true);
    }
  };

  // 监听页面可见性变化
  private handleVisibilityChange = () => {
    if (this.document.hidden && this.gameStatus() === 'playing') {
      // 页面不可见时暂停游戏
      this.pauseGame();
    }
  };

  // 拖拽画布
  private dragCanvas(x: number, y: number) {
    if (!this.isCanvasDragging()) {
      return;
    }

    const zoomScale = this.zoomScale();
    // 计算拖拽偏移量
    const deltaX = (x - this.lastDragX()) / zoomScale;
    const deltaY = (y - this.lastDragY()) / zoomScale;

    // 更新所有拼图块的位置
    this.jigsawPieces.update((pieces) => {
      return pieces.map((piece) => ({
        ...piece,
        displayX: piece.displayX + deltaX,
        displayY: piece.displayY + deltaY
      }));
    });

    // 更新上次拖拽位置
    this.lastDragX.set(x);
    this.lastDragY.set(y);

    // 重绘拼图
    this.renderPuzzle();
  }

  // 拖动拼图块
  private dragPiece(x: number, y: number) {
    const canvas = this.canvasRef().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    const selectedPiece = this.selectedPiece();
    if (!selectedPiece) {
      return;
    }

    // 计算缩放后的坐标
    const centerX = this.canvasWidth() / 2;
    const centerY = this.canvasHeight() / 2;
    const zoomScale = this.zoomScale();
    // 将鼠标坐标转换为缩放前的坐标系
    const scaledX = (x - centerX) / zoomScale + centerX;
    const scaledY = (y - centerY) / zoomScale + centerY;
    // 计算新位置，考虑缩放因素
    const newX = scaledX - this.dragOffsetX() / zoomScale;
    const newY = scaledY - this.dragOffsetY() / zoomScale;
    // 计算移动的偏移量
    const deltaX = (newX - selectedPiece.displayX) * zoomScale;
    const deltaY = (newY - selectedPiece.displayY) * zoomScale;

    // 找出当前选中拼图块所在的组
    const group = this.findConnectedGroup(selectedPiece);
    const groupIds = new Set((group || [selectedPiece]).map((piece) => piece.id));

    // 移动组内所有拼图块
    this.jigsawPieces.update((pieces) => {
      return pieces.map((piece) => {
        if (group && groupIds.has(piece.id)) {
          return {
            ...piece,
            displayX: piece.displayX + deltaX,
            displayY: piece.displayY + deltaY
          };
        }
        if (!group && piece.id === selectedPiece.id) {
          return {
            ...piece,
            displayX: newX,
            displayY: newY
          };
        }

        return piece;
      });
    });
    this.selectedPiece.set(this.jigsawPieces().find((piece) => piece.id === selectedPiece.id) || null);

    // 重绘拼图
    this.renderPuzzle(canvas, ctx);
  }

  private findConnectedGroupIds(piece: JigsawPiece): number[] | undefined {
    return this.connectedGroups().find((group) => group.includes(piece.id));
  }

  // 查找拼图块所在的连接组
  private findConnectedGroup(piece: JigsawPiece): JigsawPiece[] | undefined {
    const groupIds = this.findConnectedGroupIds(piece);
    if (!groupIds) {
      return undefined;
    }

    const pieceMap = new Map(this.jigsawPieces().map((item) => [item.id, item]));
    return groupIds.map((id) => pieceMap.get(id)).filter((item): item is JigsawPiece => !!item);
  }

  // 检查是否可以与其他拼图块拼接
  private checkForSnapping(movingPieces: JigsawPiece[]) {
    if (!movingPieces.length) {
      return;
    }

    // 获取当前难度级别的行列数
    const { rows, cols } = this.activeDifficulty();
    const pieceWidth = this.jigsawWidth() / cols;
    const pieceHeight = this.jigsawHeight() / rows;

    // 根据缩放比例调整吸附阈值
    const zoomScale = this.zoomScale();
    const adjustedSnapThreshold = this.snapThreshold / zoomScale;

    // 遍历所有拼图块，检查是否可以拼接
    const movingIds = movingPieces.map((p) => p.id);

    for (const movingPiece of movingPieces) {
      for (const piece of this.jigsawPieces()) {
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
            const movingIdSet = new Set(movingPieces.map((p) => p.id));
            this.jigsawPieces.update((pieces) => {
              return pieces.map((item) => {
                if (movingIdSet.has(item.id)) {
                  return {
                    ...item,
                    displayX: item.displayX + offsetX,
                    displayY: item.displayY + offsetY
                  };
                }

                return item;
              });
            });
            const selectedPiece = this.selectedPiece();
            if (selectedPiece) {
              this.selectedPiece.set(this.jigsawPieces().find((item) => item.id === selectedPiece.id) || null);
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
    const targetGroup = this.findConnectedGroupIds(targetPiece);
    const movingGroup = this.findConnectedGroupIds(movingPieces[0]);
    const movingIds = movingPieces.map((piece) => piece.id);

    this.connectedGroups.update((groups) => {
      if (targetGroup && movingGroup) {
        if (targetGroup === movingGroup) {
          return groups;
        }

        const remainingGroups = groups.filter((group) => group !== targetGroup && group !== movingGroup);
        return [...remainingGroups, [...new Set([...targetGroup, ...movingGroup])]];
      }

      if (targetGroup) {
        return groups.map((group) => (group === targetGroup ? [...new Set([...group, ...movingIds])] : group));
      }

      if (movingGroup) {
        return groups.map((group) => (group === movingGroup ? [...new Set([...group, targetPiece.id])] : group));
      }

      return [...groups, [...new Set([...movingIds, targetPiece.id])]];
    });

    this.gameSteps.update((steps) => steps + 1);
    if (this.gameSteps() < this.activeDifficulty().pieces - 1) {
      this.saveProgress();
    }

    // 检查是否完成拼图
    this.checkPuzzleCompletion();
  }

  // 检查拼图是否完成
  private checkPuzzleCompletion() {
    // 如果只有一个组且包含所有拼图块，则拼图完成
    const connectedGroups = this.connectedGroups();
    if (connectedGroups.length === 1 && connectedGroups[0].length === this.activeDifficulty().pieces) {
      // 停止计时器
      this.stopTimer();
      this.saveCompleteLog();
      this.clearProgress();
      // 更新游戏状态
      this.gameStatus.set('completed');
      // 显示成功消息
      this.message.success(`恭喜！拼图完成！用时：${transformDuration(this.gameTime())}`);
    }
  }

  // 检查是否选中拼图块
  private checkPieceSelection(x: number, y: number): boolean {
    const ctx = this.canvasRef().nativeElement.getContext('2d');
    if (!ctx) {
      return false;
    }

    // 计算缩放后的坐标
    const centerX = this.canvasWidth() / 2;
    const centerY = this.canvasHeight() / 2;
    const zoomScale = this.zoomScale();
    // 将鼠标坐标转换为缩放前的坐标系
    const scaledX = (x - centerX) / zoomScale + centerX;
    const scaledY = (y - centerY) / zoomScale + centerY;

    // 从后向前检查（后绘制的在上层）
    const jigsawPieces = this.jigsawPieces();
    for (let i = jigsawPieces.length - 1; i >= 0; i--) {
      const piece = jigsawPieces[i];
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
          const nextPieces = [...jigsawPieces.filter((p) => !groupIds.includes(p.id)), ...group];
          this.jigsawPieces.set(nextPieces);
          this.selectedPiece.set(nextPieces.find((item) => item.id === piece.id) || null);
        } else {
          // 如果不是组的一部分，只移动当前拼图块
          const nextPieces = [...jigsawPieces.slice(0, i), ...jigsawPieces.slice(i + 1), piece];
          this.jigsawPieces.set(nextPieces);
          this.selectedPiece.set(nextPieces.find((item) => item.id === piece.id) || null);
        }

        this.isDragging.set(true);
        // 调整拖拽偏移量，考虑缩放因素
        this.dragOffsetX.set((scaledX - piece.displayX) * zoomScale);
        this.dragOffsetY.set((scaledY - piece.displayY) * zoomScale);

        // 重绘拼图
        this.renderPuzzle(this.canvasRef().nativeElement, ctx);

        return true;
      }
    }

    return false;
  }

  // 开始计时器
  private startTimer() {
    if (this.timerInterval()) {
      window.clearInterval(this.timerInterval()!);
    }

    this.lastTimestamp.set(Date.now());
    this.timerInterval.set(
      window.setInterval(() => {
        const now = Date.now();
        const lastTimestamp = this.lastTimestamp();

        this.gameTime.update((time) => time + now - lastTimestamp);
        this.lastTimestamp.set(now);

        this.saveProgress();
      }, 1000)
    );
  }

  // 停止计时器
  private stopTimer() {
    if (this.timerInterval()) {
      window.clearInterval(this.timerInterval()!);

      this.timerInterval.set(null);
    }
  }

  private saveStartLog() {
    this.jigsawService
      .startJigsaw({
        jigsawId: this.wallpaper()?.id || '',
        pieces: this.activeDifficulty().pieces,
        timestamp: Date.now()
      })
      .then((result) => {
        result.pipe(takeUntil(this.destroy$)).subscribe((res) => {
          this.logId.set(res.logId);
          this.saveProgress();
        });
      });
  }

  private saveCompleteLog() {
    this.jigsawService
      .completeJigsaw({
        logId: this.logId(),
        gameTime: this.gameTime(),
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
      .saveProgress(this.cacheKey(), {
        i: this.logId(),
        t: Date.now(),
        c: this.activeDifficulty().pieces,
        z: this.zoomScale(),
        s: this.gameSteps(),
        d: this.gameTime(),
        w: this.canvasWidth(),
        h: this.canvasHeight(),
        p: this.jigsawPieces().map((item) => ({
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
        g: this.connectedGroups().map((group) => [...group])
      })
      .then(() => {});
  }

  private loadProgress() {
    this.jigsawCacheService.loadProgress(this.cacheKey()).then((data) => {
      this.cachedJigsaw.set(data);

      const cachedJigsaw = this.cachedJigsaw();
      const confirmModalContent = this.confirmModalContent();
      if (cachedJigsaw && confirmModalContent) {
        this.modal.confirm({
          nzWidth: 500,
          nzTitle: '存在未完成的拼图',
          nzContent: confirmModalContent,
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
    return this.jigsawCacheService.clearProgress(this.cacheKey()).then(() => {});
  }

  private getRankings() {
    this.rankingLoading.set(true);
    this.jigsawService
      .getRankings({
        id: this.wallpaper()?.id || '',
        pieces: this.activeDifficulty().pieces
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.rankingLoading.set(false);
        this.rankings.set(res);
      });
  }
}
