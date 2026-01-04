import { Injectable, DestroyRef, inject } from '@angular/core';
import { AnimationConfig } from '../models/animation.model';
import { GameLoopService } from './game-loop.service';

/**
 * Represents a running animation instance.
 */
export interface AnimationInstance {
  id: string;
  sheetId: string;
  config: AnimationConfig;
  currentFrame: number;
  isPlaying: boolean;
  elapsedTime: number;
  onFrameChange?: (frameName: string) => void;
}

let instanceIdCounter = 0;

/**
 * Service that manages sprite animations.
 * Integrates with GameLoopService for unified frame updates.
 */
@Injectable({ providedIn: 'root' })
export class AnimationControllerService {
  private instances = new Map<string, AnimationInstance>();
  private gameLoop = inject(GameLoopService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    // Register with game loop for unified updates
    const unregister = this.gameLoop.registerUpdate((dt) => this.updateAnimations(dt));
    this.destroyRef.onDestroy(() => unregister());
  }

  createAnimation(
    sheetId: string,
    config: AnimationConfig,
    onFrameChange?: (frameName: string) => void
  ): string {
    const id = `anim_${++instanceIdCounter}`;

    const instance: AnimationInstance = {
      id,
      sheetId,
      config,
      currentFrame: 0,
      isPlaying: false,
      elapsedTime: 0,
      onFrameChange,
    };

    this.instances.set(id, instance);

    if (onFrameChange && config.frames.length > 0) {
      onFrameChange(config.frames[0]);
    }

    return id;
  }

  play(id: string): void {
    const instance = this.instances.get(id);
    if (instance) {
      instance.isPlaying = true;
    }
  }

  pause(id: string): void {
    const instance = this.instances.get(id);
    if (instance) {
      instance.isPlaying = false;
    }
  }

  stop(id: string): void {
    const instance = this.instances.get(id);
    if (instance) {
      instance.isPlaying = false;
      instance.currentFrame = 0;
      instance.elapsedTime = 0;
      if (instance.onFrameChange && instance.config.frames.length > 0) {
        instance.onFrameChange(instance.config.frames[0]);
      }
    }
  }

  setAnimation(id: string, config: AnimationConfig): void {
    const instance = this.instances.get(id);
    if (instance) {
      instance.config = config;
      instance.currentFrame = 0;
      instance.elapsedTime = 0;
      if (instance.onFrameChange && config.frames.length > 0) {
        instance.onFrameChange(config.frames[0]);
      }
    }
  }

  destroy(id: string): void {
    this.instances.delete(id);
  }

  getCurrentFrame(id: string): string | null {
    const instance = this.instances.get(id);
    if (!instance) return null;
    return instance.config.frames[instance.currentFrame] || null;
  }

  /**
   * Update all animation instances (called by GameLoopService each frame)
   */
  private updateAnimations(deltaTime: number): void {
    this.instances.forEach((instance) => {
      if (!instance.isPlaying) return;

      const { config } = instance;
      const frameDuration = 1000 / config.fps;

      instance.elapsedTime += deltaTime;

      if (instance.elapsedTime >= frameDuration) {
        instance.elapsedTime -= frameDuration;
        const prevFrame = instance.currentFrame;
        instance.currentFrame++;

        if (instance.currentFrame >= config.frames.length) {
          if (config.loop) {
            instance.currentFrame = 0;
          } else {
            instance.currentFrame = config.frames.length - 1;
            instance.isPlaying = false;
          }
        }

        if (instance.currentFrame !== prevFrame && instance.onFrameChange) {
          instance.onFrameChange(config.frames[instance.currentFrame]);
        }
      }
    });
  }
}
