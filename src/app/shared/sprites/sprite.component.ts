import {
  Component,
  input,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { SpriteLoaderService } from '../../core/services/sprite-loader.service';

@Component({
  selector: 'app-sprite',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sprite.component.html',
  styleUrl: './sprite.component.scss',
})
export class SpriteComponent {
  private spriteLoader = inject(SpriteLoaderService);

  sheet = input.required<string>();
  frame = input.required<string>();
  scale = input<number>(1);
  flipX = input<boolean>(false);

  private frameData = computed(() => {
    return this.spriteLoader.getFrame(this.sheet(), this.frame());
  });

  private sheetData = computed(() => {
    return this.spriteLoader.getSheet(this.sheet());
  });

  scaledDimensions = computed(() => {
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
