import {
  Component,
  OnInit,
  AfterViewInit,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  ElementRef,
  viewChild,
  DestroyRef,
} from '@angular/core';
import { GameLoopService } from '../../core/services/game-loop.service';
import { TowerService } from '../../core/services/tower.service';
import { CameraService } from '../../core/services/camera.service';
import { PlayerControllerService } from '../../core/services/player-controller.service';
import { InputService } from '../../core/services/input.service';
import { NPC_CONFIGS } from '../components/npc/npc.component';
import { SpriteComponent } from '../../shared/sprites/sprite.component';
import { PlayerComponent } from '../player/player.component';
import { GameNotificationComponent } from '../components/game-notification/game-notification.component';
import { NPCComponent } from '../components/npc/npc.component';
import { DialogueBoxComponent } from '../components/dialogue-box/dialogue-box.component';
import { MobileControlsComponent } from '../components/mobile-controls/mobile-controls.component';
import { SectionTitleComponent } from '../components/section-title/section-title.component';
import { PHYSICS } from '../../core/constants/physics-constants';

/**
 * Tower World Component
 *
 * Renders the unified vertical tower world (Jump King style).
 * All sections are stacked vertically:
 * - CONTACT (top)    y: -2560 to -1920
 * - PROJECTS         y: -1920 to -1280
 * - SKILLS           y: -1280 to -640
 * - ABOUT            y: -640 to 0
 * - HERO (bottom)    y: 0 to 640
 */
@Component({
  selector: 'app-tower-world',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tower-world.component.html',
  styleUrl: './tower-world.component.scss',
  imports: [
    SpriteComponent,
    PlayerComponent,
    GameNotificationComponent,
    NPCComponent,
    DialogueBoxComponent,
    MobileControlsComponent,
    SectionTitleComponent,
  ],
})
export class TowerWorldComponent implements OnInit, AfterViewInit {
  private gameLoop = inject(GameLoopService);
  private tower = inject(TowerService);
  private camera = inject(CameraService);
  private playerController = inject(PlayerControllerService);
  private inputService = inject(InputService);
  private destroyRef = inject(DestroyRef);

  private gameContainer = viewChild<ElementRef<HTMLDivElement>>('gameContainer');
  private sectionTitle = viewChild(SectionTitleComponent);

  // Tower dimensions
  readonly VIEWPORT_WIDTH = 384;
  readonly VIEWPORT_HEIGHT = 640;

  // Player state
  readonly playerPosition = this.playerController.position;
  readonly playerState = this.playerController.state;
  readonly playerFacingRight = this.playerController.facingRight;
  readonly playerTopPosition = this.playerController.topPosition;
  readonly isCharging = this.playerController.isCharging;
  readonly chargePercent = this.playerController.chargePercent;
  readonly chargeColor = this.playerController.chargeColor;
  readonly isFullyCharged = this.playerController.isFullyCharged;
  readonly isClimbing = this.playerController.isClimbing;

  // Background: clouds when climbing ladder in contact OR teleporting via menubar
  private hasReachedClouds = signal(false);
  readonly backgroundClass = computed(() =>
    this.hasReachedClouds() ? 'bg-clouds' : 'bg-trees'
  );

  // Effect to track when player reaches clouds
  private backgroundEffect = effect(() => {
    const section = this.currentSection();
    const climbing = this.isClimbing();
    const teleported = this.playerController.justTeleported();

    // Handle teleport first (reset flag regardless of section)
    if (teleported) {
      if (section === 'contact') {
        // Menubar teleport to contact → show clouds
        this.hasReachedClouds.set(true);
      }
      // Reset the flag after processing (microtask to avoid effect loop)
      queueMicrotask(() => this.playerController.justTeleported.set(false));
      return;
    }

    if (section === 'contact' && climbing) {
      // Climbing ladder in contact → show clouds (sticky)
      this.hasReachedClouds.set(true);
    } else if (section !== 'contact') {
      // Left contact section → reset to trees
      this.hasReachedClouds.set(false);
    }
    // Note: walking in contact without climbing keeps previous state (trees)
  });

  // Tower data (cached signals from TowerService)
  private readonly allTerrain = this.tower.allTerrain;
  private readonly allDecorations = this.tower.allDecorations;
  readonly npcs = this.tower.allNPCs;

  // Visible tiles (filtered by camera viewport for performance)
  readonly terrain = computed(() => {
    const tiles = this.allTerrain();
    return tiles.filter((tile) =>
      this.camera.isVisible(tile.x, tile.y, PHYSICS.TILE_SIZE, PHYSICS.TILE_SIZE)
    );
  });

  readonly decorations = computed(() => {
    const decos = this.allDecorations();
    return decos.filter((d) => this.camera.isVisible(d.x, d.y, 64, 64));
  });

  private readonly allLadderTiles = computed(() => {
    const ladders = this.tower.allLadders();
    const tiles: { id: string; x: number; y: number; frame: string }[] = [];

    for (const ladder of ladders) {
      for (let i = 0; i < ladder.heightTiles; i++) {
        const y = ladder.topY + i * PHYSICS.TILE_SIZE;
        let frame: string;

        if (i === 0) {
          frame = 'ladder_top';
        } else if (i === ladder.heightTiles - 1) {
          frame = 'ladder_bottom';
        } else {
          frame = 'ladder_middle';
        }

        tiles.push({
          id: `${ladder.id}_${i}`,
          x: ladder.x,
          y,
          frame,
        });
      }
    }

    return tiles;
  });

  readonly ladderTiles = computed(() => {
    const tiles = this.allLadderTiles();
    return tiles.filter((t) =>
      this.camera.isVisible(t.x, t.y, PHYSICS.TILE_SIZE, PHYSICS.TILE_SIZE)
    );
  });

  // Current section for UI
  readonly currentSection = this.tower.currentSection;

  // Camera transform
  readonly contentTransform = this.camera.contentTransform;

  // Intro state
  readonly isIntroPlaying = signal(true);

  // Nearby NPC detection for mobile interact button
  readonly nearbyNPC = computed(() => {
    const playerPos = this.playerPosition();
    const npcs = this.npcs();

    for (const npc of npcs) {
      const config = NPC_CONFIGS[npc.sprite] || NPC_CONFIGS['frog'];
      const distance = Math.hypot(npc.x - playerPos.x, npc.y - playerPos.y);
      if (distance < config.interactionRadius) {
        return npc;
      }
    }
    return null;
  });

  // Effect to update InputService with nearby NPC
  private nearbyNPCEffect = effect(() => {
    this.inputService.setNearbyNPC(this.nearbyNPC());
  });

  // Colliders (cached signals from TowerService)
  private readonly terrainColliders = this.tower.allColliders;
  private readonly ladderColliders = this.tower.ladderColliders;

  ngAfterViewInit(): void {
    this.focusGame();
  }

  async ngOnInit(): Promise<void> {
    // Initialize player at spawn point (hero section ground)
    const spawn = this.tower.getSpawnPoint();
    const heroGroundLevel = this.tower.getGroundLevel('hero');
    this.playerController.initAtEntry(
      { x: spawn.x, direction: 'right', type: 'fall' },
      heroGroundLevel
    );

    // Initialize camera at bottom of tower
    this.camera.reset();

    // Register update callback with game loop
    const unregister = this.gameLoop.registerUpdate((dt) => this.update(dt));
    this.destroyRef.onDestroy(() => unregister());

    // Play entry animation
    await this.playEntryAnimation();
  }

  private async playEntryAnimation(): Promise<void> {
    // Brief delay then show section title
    await new Promise((resolve) => setTimeout(resolve, 500));
    this.isIntroPlaying.set(false);
    this.sectionTitle()?.show();
  }

  private update(deltaTime: number): void {
    // Update player physics
    this.playerController.update(
      deltaTime,
      this.terrainColliders(),
      this.tower.getPageWidth(),
      this.ladderColliders()
    );

    // Update camera to follow player
    const playerY = this.playerController.getBody()?.position.y ?? 0;
    this.camera.update(playerY);

    // Check for section changes
    this.checkSectionChange();

    // Check if player fell below tower
    this.checkFallOut(playerY);
  }

  private checkSectionChange(): void {
    const change = this.camera.sectionChanged();
    if (change) {
      // Show section title when entering new section
      this.sectionTitle()?.show();
      this.camera.clearSectionChange();
    }
  }

  private checkFallOut(playerY: number): void {
    if (this.tower.isBelowTower(playerY)) {
      // Respawn at hero section
      this.respawnAtHero();
    }
  }

  private respawnAtHero(): void {
    const spawn = this.tower.getSpawnPoint();
    const heroGroundLevel = this.tower.getGroundLevel('hero');
    this.playerController.initAtEntry(
      { x: spawn.x, direction: 'right', type: 'fall' },
      heroGroundLevel
    );
    this.camera.setPosition(0, 0);
    this.tower.updateCurrentSection(0);
  }

  /**
   * Focus the game container to capture keyboard events
   */
  focusGame(): void {
    const container = this.gameContainer()?.nativeElement;
    if (container) {
      container.focus();
    }
  }

  /**
   * Get section title translation key
   */
  getSectionTitle(): string {
    return this.tower.getSectionTitle(this.currentSection());
  }
}
