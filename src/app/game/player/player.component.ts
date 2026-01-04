import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { AnimatedSpriteComponent } from '../../shared/sprites/animated-sprite.component';
import { CHARACTER_ANIMATIONS, AnimationConfig } from '../../core/models/animation.model';
import { EntityState } from '../../core/models/game-entity.model';

@Component({
  selector: 'app-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './player.component.html',
  styleUrl: './player.component.scss',
  imports: [AnimatedSpriteComponent],
  host: {
    class: 'player',
  },
})
export class PlayerComponent {
  state = input<EntityState>('idle');
  facingRight = input<boolean>(true);
  scale = input<number>(2);

  // Get the animation config based on current state
  currentAnimation = computed((): AnimationConfig => {
    const stateToAnim: Record<EntityState, string> = {
      idle: 'idle',
      walk: 'walk',
      jump: 'jump',
      climb: 'climb',
      fall: 'jump', // Use jump animation for falling
      hit: 'hit',
      charge: 'duck', // Crouch animation while charging jump
    };

    const animName = stateToAnim[this.state()] || 'idle';
    return CHARACTER_ANIMATIONS.green[animName];
  });
}
