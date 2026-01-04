/**
 * Configuration for a sprite animation.
 * Defines the sequence of frames, playback speed, and looping behavior.
 */
export interface AnimationConfig {
  /** Animation name identifier */
  name: string;
  /** Array of frame names in the animation sequence */
  frames: string[];
  /** Frames per second (playback speed) */
  fps: number;
  /** Whether the animation should loop */
  loop: boolean;
}

/** Available character colors */
export type CharacterColor = 'beige' | 'green' | 'pink' | 'purple' | 'yellow';

/** Array of all available character colors */
export const CHARACTER_COLORS: CharacterColor[] = ['beige', 'green', 'pink', 'purple', 'yellow'];

/**
 * Factory function to create character animations with a specific color.
 * Generates all animation configurations for a character (idle, walk, jump, duck, hit, climb, front).
 * @param color - The character color
 * @returns Record of animation configurations
 */
export function createCharacterAnimations(color: CharacterColor): Record<string, AnimationConfig> {
  const prefix = `character_${color}`;
  return {
    idle: {
      name: 'idle',
      frames: [`${prefix}_idle`],
      fps: 1,
      loop: true,
    },
    walk: {
      name: 'walk',
      frames: [`${prefix}_walk_a`, `${prefix}_walk_b`],
      fps: 8,
      loop: true,
    },
    jump: {
      name: 'jump',
      frames: [
        `${prefix}_walk_a`, `${prefix}_walk_b`,
        `${prefix}_jump`, `${prefix}_jump`, `${prefix}_jump`,
        `${prefix}_duck`,
        `${prefix}_walk_a`, `${prefix}_walk_b`,
      ],
      fps: 10,
      loop: true,
    },
    duck: {
      name: 'duck',
      frames: [`${prefix}_duck`],
      fps: 1,
      loop: true,
    },
    hit: {
      name: 'hit',
      frames: [`${prefix}_hit`, `${prefix}_hit`, `${prefix}_idle`],
      fps: 3,
      loop: true,
    },
    climb: {
      name: 'climb',
      frames: [`${prefix}_climb_a`, `${prefix}_climb_b`],
      fps: 6,
      loop: true,
    },
    front: {
      name: 'front',
      frames: [`${prefix}_front`],
      fps: 1,
      loop: true,
    },
  };
}

// Pre-built animations for each character color
export const CHARACTER_ANIMATIONS: Record<CharacterColor, Record<string, AnimationConfig>> = {
  beige: createCharacterAnimations('beige'),
  green: createCharacterAnimations('green'),
  pink: createCharacterAnimations('pink'),
  purple: createCharacterAnimations('purple'),
  yellow: createCharacterAnimations('yellow'),
};

export const ENEMY_ANIMATIONS: Record<string, AnimationConfig> = {
  // Barnacle
  barnacle_attack: {
    name: 'barnacle_attack',
    frames: ['barnacle_attack_a', 'barnacle_attack_b'],
    fps: 4,
    loop: true,
  },
  barnacle_rest: {
    name: 'barnacle_rest',
    frames: ['barnacle_attack_rest'],
    fps: 1,
    loop: true,
  },
  // Bee
  bee_fly: {
    name: 'bee_fly',
    frames: ['bee_a', 'bee_b'],
    fps: 12,
    loop: true,
  },
  bee_rest: {
    name: 'bee_rest',
    frames: ['bee_rest'],
    fps: 1,
    loop: true,
  },
  // Ladybug
  ladybug_walk: {
    name: 'ladybug_walk',
    frames: ['ladybug_walk_a', 'ladybug_walk_b'],
    fps: 6,
    loop: true,
  },
  ladybug_fly: {
    name: 'ladybug_fly',
    frames: ['ladybug_fly'],
    fps: 1,
    loop: true,
  },
  // Slime Normal
  slime_normal_walk: {
    name: 'slime_normal_walk',
    frames: ['slime_normal_walk_a', 'slime_normal_walk_b'],
    fps: 6,
    loop: true,
  },
  slime_normal_flat: {
    name: 'slime_normal_flat',
    frames: ['slime_normal_flat'],
    fps: 1,
    loop: true,
  },
  // Snail
  snail_walk: {
    name: 'snail_walk',
    frames: ['snail_walk_a', 'snail_walk_b'],
    fps: 4,
    loop: true,
  },
  snail_shell: {
    name: 'snail_shell',
    frames: ['snail_shell'],
    fps: 1,
    loop: true,
  },
};
