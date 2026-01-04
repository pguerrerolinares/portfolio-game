import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
  signal,
  inject,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { SpriteComponent } from '../../../shared/sprites/sprite.component';
import { NPC } from '../../../core/models/world.model';
import { Vector2 } from '../../../core/models/physics.model';
import { DialogueService } from '../../../core/services/dialogue.service';
import { GameLoopService } from '../../../core/services/game-loop.service';
import { InputService } from '../../../core/services/input.service';

/**
 * NPC type configuration
 */
interface NPCConfig {
  frames: string[];
  animationSpeed: number;
  interactionRadius: number;
}

export const NPC_CONFIGS: Record<string, NPCConfig> = {
  frog: {
    frames: ['frog_idle', 'frog_jump'],
    animationSpeed: 400,
    interactionRadius: 80,
  },
  ladybug: {
    frames: ['ladybug_walk_a', 'ladybug_walk_b'],
    animationSpeed: 400,
    interactionRadius: 70,
  },
  snail: {
    frames: ['snail_walk_a', 'snail_walk_b'],
    animationSpeed: 600,
    interactionRadius: 70,
  },
  mouse: {
    frames: ['mouse_walk_a', 'mouse_walk_b'],
    animationSpeed: 300,
    interactionRadius: 70,
  },
};

@Component({
  selector: 'app-npc',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SpriteComponent],
  template: `
    <div
      class="npc-container"
      [class.player-nearby]="isPlayerNearby()"
      [class.talking]="isTalking()"
      [style.left.px]="currentX()"
      [style.top.px]="adjustedY()"
      (click)="onClick($event)"
    >
      <div class="npc-indicator" [class.visible]="isPlayerNearby() && !isTalking()">
        !
      </div>
      <div class="sprite-wrapper" [class.flip]="facingRight()">
        <app-sprite
          sheet="enemies"
          [frame]="currentFrame()"
          [scale]="0.7"
        />
      </div>
    </div>
  `,
  styles: `
    .npc-container {
      position: absolute;
      cursor: pointer;
    }

    .sprite-wrapper {
      transition: transform 0.1s ease;
    }

    .sprite-wrapper.flip {
      transform: scaleX(-1);
    }

    .npc-indicator {
      position: absolute;
      top: -24px;
      left: 50%;
      transform: translateX(-50%);
      background: #ffd700;
      color: #000;
      font-family: 'Press Start 2P', monospace;
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 4px;
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 10;
    }

    .npc-indicator.visible {
      opacity: 1;
      animation: indicator-bounce 0.5s ease-in-out infinite;
    }

    @keyframes indicator-bounce {
      0%, 100% { transform: translateX(-50%) translateY(0); }
      50% { transform: translateX(-50%) translateY(-4px); }
    }
  `,
})
export class NPCComponent implements OnInit {
  private dialogueService = inject(DialogueService);
  private gameLoop = inject(GameLoopService);
  private inputService = inject(InputService);
  private destroyRef = inject(DestroyRef);

  // Input: NPC configuration
  readonly npc = input.required<NPC>();

  // Input: player position for proximity detection
  readonly playerPosition = input<Vector2>({ x: 0, y: 0 });

  // Animation frame index
  private frameIndex = signal(0);
  private animationElapsed = 0;

  // Patrol state
  readonly currentX = signal(0);
  readonly facingRight = signal(true);

  // Scale and Y offset (compensate for smaller sprite)
  private readonly NPC_SCALE = 0.7;
  private readonly SPRITE_HEIGHT = 64;
  readonly adjustedY = computed(() => {
    const baseY = this.npc().y;
    const heightDiff = this.SPRITE_HEIGHT * (1 - this.NPC_SCALE);
    return baseY + heightDiff;
  });

  // Get NPC config
  readonly config = computed(() => {
    const sprite = this.npc().sprite;
    return NPC_CONFIGS[sprite] || NPC_CONFIGS['frog'];
  });

  // Check if NPC has patrol behavior
  readonly hasPatrol = computed(() => {
    const npc = this.npc();
    return npc.patrolMinX !== undefined && npc.patrolMaxX !== undefined;
  });

  // Current animation frame (stops when player is nearby)
  readonly currentFrame = computed(() => {
    const config = this.config();
    // Stop animation when player is nearby - show first frame
    if (this.isPlayerNearby()) {
      return config.frames[0];
    }
    return config.frames[this.frameIndex() % config.frames.length];
  });

  // Distance to player (use currentX for patrol NPCs, adjustedY for scale)
  readonly distanceToPlayer = computed(() => {
    const npcX = this.currentX();
    const npcY = this.adjustedY();
    const player = this.playerPosition();
    return Math.hypot(player.x - npcX, player.y - npcY);
  });

  // Is player nearby (shows interaction hint)
  readonly isPlayerNearby = computed(() => {
    return this.distanceToPlayer() < this.config().interactionRadius;
  });

  // Is currently talking to this NPC
  readonly isTalking = computed(() => {
    const current = this.dialogueService.currentNPC();
    return current?.id === this.npc().id;
  });

  ngOnInit(): void {
    // Initialize position
    this.currentX.set(this.npc().x);

    // Register update callback with game loop (handles both animation and patrol)
    const unregister = this.gameLoop.registerUpdate((deltaTime) => this.update(deltaTime));

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => unregister());
  }

  /**
   * Update NPC animation and patrol (called by GameLoopService each frame)
   */
  private update(deltaTime: number): void {
    this.updateAnimation(deltaTime);
    this.updatePatrol(deltaTime);
  }

  /**
   * Update animation frame based on elapsed time
   */
  private updateAnimation(deltaTime: number): void {
    const config = this.config();
    this.animationElapsed += deltaTime;

    if (this.animationElapsed >= config.animationSpeed) {
      this.animationElapsed = 0;
      this.frameIndex.update((i) => i + 1);
    }
  }

  /**
   * Update patrol movement (frame-rate independent)
   */
  private updatePatrol(deltaTime: number): void {
    if (!this.hasPatrol()) return;

    // Don't move when player is nearby or talking
    if (this.isPlayerNearby() || this.isTalking()) return;

    const npc = this.npc();
    const baseSpeed = npc.patrolSpeed ?? 0.5;
    // Convert from per-frame speed to per-second, then apply deltaTime
    const speed = (baseSpeed * deltaTime) / 16.67; // Normalize to ~60fps equivalent
    const minX = npc.patrolMinX!;
    const maxX = npc.patrolMaxX!;

    const x = this.currentX();
    const right = this.facingRight();

    if (right) {
      const newX = x + speed;
      if (newX >= maxX) {
        this.currentX.set(maxX);
        this.facingRight.set(false);
      } else {
        this.currentX.set(newX);
      }
    } else {
      const newX = x - speed;
      if (newX <= minX) {
        this.currentX.set(minX);
        this.facingRight.set(true);
      } else {
        this.currentX.set(newX);
      }
    }
  }

  onClick(event: Event): void {
    event.stopPropagation();

    // On mobile, use the dedicated NPC interact button instead
    if (this.inputService.isMobile()) return;

    // Only allow interaction if player is nearby
    if (!this.isPlayerNearby()) return;

    // Don't start new dialogue if already talking
    if (this.dialogueService.isOpen()) return;

    // Open dialogue
    this.dialogueService.open(this.npc());
  }
}
