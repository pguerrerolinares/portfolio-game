import { Injectable, signal, DestroyRef, inject } from '@angular/core';

/**
 * Game loop service that provides a single RAF loop for the entire game.
 * Components register update callbacks to be called each frame.
 */
@Injectable({ providedIn: 'root' })
export class GameLoopService {
  private frameId: number | null = null;
  private lastTime = 0;
  private updateCallbacks: ((deltaTime: number) => void)[] = [];
  private destroyRef = inject(DestroyRef);

  readonly isRunning = signal(false);
  readonly fps = signal(0);
  readonly deltaTime = signal(0);

  constructor() {
    this.destroyRef.onDestroy(() => this.stop());
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning()) return;

    this.isRunning.set(true);
    this.lastTime = performance.now();
    this.loop();
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.isRunning.set(false);
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  /**
   * Register an update callback to be called each frame
   * @returns Unregister function
   */
  registerUpdate(callback: (deltaTime: number) => void): () => void {
    this.updateCallbacks.push(callback);
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  private loop = (): void => {
    if (!this.isRunning()) return;

    const now = performance.now();
    const deltaTime = Math.min(now - this.lastTime, 33.33); // Cap at ~30fps worth of delta
    this.lastTime = now;

    this.deltaTime.set(deltaTime);
    this.fps.set(Math.round(1000 / deltaTime));

    // Call all registered update callbacks
    for (const callback of this.updateCallbacks) {
      try {
        callback(deltaTime);
      } catch (error) {
        console.error('[GameLoop] Callback error:', error);
      }
    }

    this.frameId = requestAnimationFrame(this.loop);
  };
}
