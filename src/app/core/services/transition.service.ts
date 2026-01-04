import { Injectable, signal, computed } from '@angular/core';
import { SectionId, TransitionState, TransitionType } from '../models/world.model';

/**
 * Transition animation durations (ms)
 */
const TRANSITION_DURATIONS = {
  pipe: 800,
  door: 600,
  flag: 1000,
  fall: 500,
  fadeOut: 300,
  fadeIn: 300,
};

/**
 * Service for managing Mario-style page transitions
 */
@Injectable({ providedIn: 'root' })
export class TransitionService {
  // Current transition state
  readonly state = signal<TransitionState>('none');

  // Transition type being performed
  readonly type = signal<TransitionType | null>(null);

  // Target section for transition
  readonly targetSection = signal<SectionId | null>(null);

  // Progress of current transition (0-1)
  readonly progress = signal(0);

  // Screen fade opacity (0 = visible, 1 = black)
  readonly fadeOpacity = signal(0);

  // Is transitioning
  readonly isTransitioning = computed(() => this.state() !== 'none');

  // Direction for animation
  readonly direction = signal<'up' | 'down' | 'left' | 'right'>('down');

  /**
   * Start exit transition (player enters pipe/door/flag)
   */
  async startExitTransition(
    targetSection: SectionId,
    type: TransitionType,
    direction: 'up' | 'down' | 'left' | 'right'
  ): Promise<void> {
    this.state.set('exiting');
    this.type.set(type);
    this.targetSection.set(targetSection);
    this.direction.set(direction);
    this.progress.set(0);

    // Animate exit
    await this.animateProgress(TRANSITION_DURATIONS[type]);

    // Fade to black
    await this.animateFade(1, TRANSITION_DURATIONS.fadeOut);
  }

  /**
   * Start entry transition (player emerges from pipe/door/falls)
   */
  async startEntryTransition(type: TransitionType): Promise<void> {
    this.state.set('entering');
    this.type.set(type);
    this.progress.set(0);

    // Fade from black
    await this.animateFade(0, TRANSITION_DURATIONS.fadeIn);

    // Animate entry
    await this.animateProgress(TRANSITION_DURATIONS[type]);

    // Complete
    this.state.set('none');
    this.type.set(null);
    this.targetSection.set(null);
  }

  /**
   * Animate progress from 0 to 1
   */
  private animateProgress(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        this.progress.set(progress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Animate fade opacity
   */
  private animateFade(targetOpacity: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startOpacity = this.fadeOpacity();
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const opacity = startOpacity + (targetOpacity - startOpacity) * progress;
        this.fadeOpacity.set(opacity);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Get player offset during transition
   * Simplified to use only horizontal movement and opacity fades
   * to avoid player going through terrain
   */
  getPlayerOffset(): { x: number; y: number; opacity: number } {
    const progress = this.progress();
    const type = this.type();
    const direction = this.direction();
    const state = this.state();

    if (!type || state === 'none') {
      return { x: 0, y: 0, opacity: 1 };
    }

    const maxOffset = 64;

    if (state === 'exiting') {
      switch (type) {
        case 'pipe':
          // Only horizontal movement for pipes, fade out
          if (direction === 'left') return { x: -progress * maxOffset, y: 0, opacity: 1 - progress };
          if (direction === 'right') return { x: progress * maxOffset, y: 0, opacity: 1 - progress };
          // For up/down pipes, just fade
          return { x: 0, y: 0, opacity: 1 - progress };
        case 'door':
          // Fade out in place
          return { x: 0, y: 0, opacity: 1 - progress };
        case 'flag':
          // Fade out in place
          return { x: 0, y: 0, opacity: 1 - progress };
        case 'fall':
          // Fade out
          return { x: 0, y: 0, opacity: 1 - progress };
      }
    }

    if (state === 'entering') {
      const reverseProgress = 1 - progress;
      switch (type) {
        case 'pipe':
          // Only horizontal movement for pipes, fade in
          if (direction === 'left') return { x: reverseProgress * maxOffset, y: 0, opacity: progress };
          if (direction === 'right') return { x: -reverseProgress * maxOffset, y: 0, opacity: progress };
          // For up/down pipes, just fade
          return { x: 0, y: 0, opacity: progress };
        case 'door':
          // Fade in
          return { x: 0, y: 0, opacity: progress };
        case 'fall':
          // Fall from above (this is fine, player starts above ground)
          return { x: 0, y: -reverseProgress * maxOffset * 3, opacity: 1 };
        case 'flag':
          // Fade in
          return { x: 0, y: 0, opacity: progress };
      }
    }

    return { x: 0, y: 0, opacity: 1 };
  }
}
