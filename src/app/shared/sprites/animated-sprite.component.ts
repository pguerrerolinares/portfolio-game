import {
  Component,
  input,
  output,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { SpriteLoaderService } from '../../core/services/sprite-loader.service';
import { AnimationControllerService } from '../../core/services/animation-controller.service';
import { AnimationConfig } from '../../core/models/animation.model';

@Component({
  selector: 'app-animated-sprite',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './animated-sprite.component.html',
  styleUrl: './animated-sprite.component.scss',
})
export class AnimatedSpriteComponent implements OnInit, OnChanges {
  private spriteLoader = inject(SpriteLoaderService);
  private animController = inject(AnimationControllerService);
  private destroyRef = inject(DestroyRef);

  sheet = input.required<string>();
  animation = input.required<AnimationConfig>();
  scale = input<number>(1);
  flipX = input<boolean>(false);
  autoPlay = input<boolean>(true);

  animationEnd = output<void>();

  private animationId: string | null = null;
  currentFrameName = signal<string>('');

  ngOnInit(): void {
    this.setupAnimation();
    this.destroyRef.onDestroy(() => this.cleanupAnimation());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['animation'] && !changes['animation'].firstChange) {
      this.setupAnimation();
    }
  }

  private setupAnimation(): void {
    this.cleanupAnimation();

    const config = this.animation();
    const sheetId = this.sheet();

    this.animationId = this.animController.createAnimation(
      sheetId,
      config,
      (frameName) => {
        this.currentFrameName.set(frameName);
      }
    );

    if (this.autoPlay()) {
      this.animController.play(this.animationId);
    }
  }

  private cleanupAnimation(): void {
    if (this.animationId) {
      this.animController.destroy(this.animationId);
      this.animationId = null;
    }
  }

  play(): void {
    if (this.animationId) this.animController.play(this.animationId);
  }

  pause(): void {
    if (this.animationId) this.animController.pause(this.animationId);
  }

  stop(): void {
    if (this.animationId) this.animController.stop(this.animationId);
  }

  private frameData = computed(() => {
    const frameName = this.currentFrameName();
    if (!frameName) return null;
    return this.spriteLoader.getFrame(this.sheet(), frameName);
  });

  private sheetData = computed(() => {
    return this.spriteLoader.getSheet(this.sheet());
  });

  private maxDimensions = computed(() => {
    const config = this.animation();
    const sheetId = this.sheet();
    let maxWidth = 0;
    let maxHeight = 0;

    for (const frameName of config.frames) {
      const frame = this.spriteLoader.getFrame(sheetId, frameName);
      if (frame) {
        maxWidth = Math.max(maxWidth, frame.width);
        maxHeight = Math.max(maxHeight, frame.height);
      }
    }

    return { width: maxWidth, height: maxHeight };
  });

  scaledDimensions = computed(() => {
    const max = this.maxDimensions();
    const s = this.scale();
    return {
      width: max.width * s,
      height: max.height * s,
    };
  });

  currentFrameDimensions = computed(() => {
    const frame = this.frameData();
    const s = this.scale();
    return {
      width: (frame?.width ?? 0) * s,
      height: (frame?.height ?? 0) * s,
    };
  });

  backgroundImage = computed(() => {
    const sheet = this.sheetData();
    return sheet ? `url(${sheet.imagePath})` : 'none';
  });

  backgroundPosition = computed(() => {
    const frame = this.frameData();
    const s = this.scale();
    if (!frame) return '0 0';
    return `-${frame.x * s}px -${frame.y * s}px`;
  });

  backgroundSize = computed(() => {
    const sheet = this.sheetData();
    const s = this.scale();
    if (!sheet) return 'auto';
    return `${sheet.imageWidth * s}px ${sheet.imageHeight * s}px`;
  });

  flipTransform = computed(() => {
    return this.flipX() ? 'scaleX(-1)' : 'none';
  });
}
