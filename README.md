# Pixel Portfolio

A 2D pixel-art platformer portfolio built with Angular 21. Navigate through different sections of the portfolio as a character in a retro-style game world.

## Features

### Game Mechanics

| Mechanic | Description | Controls |
|----------|-------------|----------|
| **Walking** | Horizontal movement | Arrow Keys / WASD or Click/Tap |
| **Charge Jump** | Hold to charge, release to jump (Jump King style) | Hold Space, aim with arrows |
| **Wall Jump** | Bounce off walls while airborne | Jump while touching wall |
| **Wall Slide** | Slow descent when against wall | Hold towards wall while falling |
| **Ladder Climbing** | Vertical movement on ladders | W/S or Up/Down while on ladder |
| **NPC Interaction** | Talk to characters | Walk near NPC |

### Charge Jump System

Jump King-style charged jumping:
1. **Hold** Space to start charging
2. **Aim** left/right while charging (arrows/WASD)
3. **Release** to jump with force proportional to charge
4. **Visual feedback**: Progress bar above player with color gradient (Green → Yellow → Red)

### Sections

- **Hero** - Landing/intro section with tutorial elements
- **About** - Personal information with tree-themed layout
- **Skills** - Technical skills with diagonal platforming
- **Projects** - Portfolio projects with wall jump challenges
- **Contact** - Contact info with ladder climb to victory

## Architecture

```
src/app/
├── core/                    # Core game logic
│   ├── constants/           # Game configuration
│   │   ├── physics-constants.ts    # Physics values
│   │   ├── game-config.ts          # Centralized game config
│   │   └── sections/               # Individual section layouts
│   │       ├── section-utils.ts    # Terrain generation helpers
│   │       ├── hero.config.ts
│   │       ├── about.config.ts
│   │       ├── skills.config.ts
│   │       ├── projects.config.ts
│   │       └── contact.config.ts
│   ├── models/              # TypeScript interfaces
│   │   ├── physics.model.ts        # Vector2, AABB, PhysicsBody
│   │   ├── world.model.ts          # Section, Terrain, NPC, Ladder
│   │   ├── game-entity.model.ts    # EntityState, Enemy
│   │   └── animation.model.ts      # Animation configs
│   └── services/            # Game services
│       ├── tower.service.ts        # Vertical tower with cached signals
│       ├── camera.service.ts       # Smooth follow camera with dead zones
│       ├── physics.service.ts      # Physics engine
│       ├── player-controller.service.ts  # Player state/movement
│       ├── charge-jump.service.ts  # Jump King style charge system
│       ├── input.service.ts        # Keyboard/touch input
│       ├── game-loop.service.ts    # Unified RAF game loop (try-catch)
│       ├── animation-controller.service.ts  # Sprite animations
│       └── notification.service.ts  # In-game notifications
├── game/                    # Game components
│   ├── tower-world/         # Unified tower renderer with visibility culling
│   ├── player/              # Player sprite/animation
│   └── components/
│       ├── menubar/         # Navigation menu (Angular Aria)
│       ├── mobile-controls/ # Mobile controls container
│       ├── joystick/        # Touch joystick for movement
│       ├── jump-button/     # Charge jump button with ring
│       ├── npc-interact-button/ # NPC interaction button
│       ├── section-title/   # Animated section titles
│       ├── npc/             # Interactive NPCs
│       ├── dialogue-box/    # NPC dialogues
│       └── game-notification/ # In-game notifications
└── shared/                  # Shared components (sprites)
```

## Tower Architecture

The game uses a vertical tower structure (Jump King style) where all sections are stacked:

```
CONTACT (top)    y: -2560 to -1920
PROJECTS         y: -1920 to -1280
SKILLS           y: -1280 to -640
ABOUT            y: -640 to 0
HERO (bottom)    y: 0 to 640
```

### Services

- **TowerService**: Manages unified world with cached signals (`allTerrain`, `allColliders`, `allNPCs`, etc.)
- **CameraService**: Vertical scrolling with dead zones, smooth lerp, and `isVisible()` for culling
- **GameLoopService**: Single RAF loop with try-catch for error resilience

### Performance Optimizations

- **Cached computed signals**: Tower data only recalculated when dependencies change
- **Visibility culling**: Only renders tiles within camera viewport (~10-15 vs ~200 DOM nodes)
- **Single game loop**: All physics, animations, and updates in one RAF callback

## Physics System

### Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `GRAVITY` | 0.35 | Downward acceleration per frame |
| `JUMP_FORCE` | -9.5 | Initial jump velocity (~120px max height) |
| `PLAYER_SPEED` | 3.5 | Horizontal movement speed |
| `CLIMB_SPEED` | 3 | Ladder climbing speed |
| `WALL_JUMP_FORCE` | -8.5 | Wall jump vertical force (90% of normal) |
| `WALL_KICK_FORCE` | 5 | Horizontal push from wall jump |
| `WALL_SLIDE_SPEED` | 1.5 | Max fall speed when wall sliding |
| `TILE_SIZE` | 64 | Pixels per tile |
| `CHARGE_TIME_MS` | 800 | Time to reach full charge |
| `CHARGE_MIN_THRESHOLD` | 0.1 | Minimum charge to jump (10%) |
| `CHARGE_JUMP_MIN_FORCE` | -6 | Jump force at minimum charge |
| `CHARGE_JUMP_MAX_FORCE` | -14 | Jump force at full charge |
| `CHARGE_JUMP_HORIZONTAL` | 6 | Horizontal velocity when aiming |

### Jump Physics

```
Max Jump Height = (JUMP_FORCE^2) / (2 * GRAVITY)
                = (9.5^2) / (2 * 0.35)
                = 90.25 / 0.7
                ≈ 129 pixels (~2 tiles)
```

### Player Collision Box

- Visual size: 96x96 pixels (128x128 sprite at 0.75 scale)
- Collision box: 48x80 pixels (centered, smaller for better feel)
- Offset: 24px horizontal, 16px vertical from visual

## Level Design

### Page Dimensions

- Width: 384px (6 tiles)
- Height: 640px (10 tiles)
- Ground level: y=576 (bottom tile)

### Terrain Utilities (`section-utils.ts`)

```typescript
// Horizontal platform
terrain(x, widthTiles, y, 'terrain_stone', 'id_prefix', 'flush?')

// Filled block (multi-row terrain)
block(x, y, widthTiles, heightTiles, 'terrain_grass', 'id_prefix')
```

### Flush Parameter

Platforms at screen edges use `flush` to remove borders:
- `'left'` - No left border (flush with left edge)
- `'right'` - No right border (flush with right edge)
- `'both'` - No borders (full-width ground)

## Ladder System

### Configuration

```typescript
ladders: [
  {
    id: 'section_ladder',
    x: TILE * 2,           // X position
    topY: GROUND_Y - TILE * 5,  // Top of ladder (Y)
    heightTiles: 5,        // Height in tiles
  },
]
```

### Climbing Logic

1. Player detected on ladder via AABB overlap
2. Up/Down input sets climb direction
3. Player velocity controlled by `CLIMB_SPEED`
4. Gravity disabled while climbing
5. Player exits ladder naturally when feet reach top
6. Space key jumps off ladder

### Key Implementation Details

- Ladder collider: `{ x, y: topY, width: TILE, height: heightTiles * TILE }`
- Exit detection: When `player.y + player.height <= ladder.y`, player is above ladder
- Jump trigger cleared while climbing to prevent accidental jumps

## Wall Jump System

### Detection

```typescript
isTouchingWall(body, terrain): 'left' | 'right' | null
```

Uses side sensors (4px wide) to detect wall contact.

### Execution

```typescript
wallJump(body, wallSide): void {
  body.velocity.y = WALL_JUMP_FORCE;  // -8.5
  body.velocity.x = wallSide === 'left' ? WALL_KICK_FORCE : -WALL_KICK_FORCE;
  body.facingRight = wallSide === 'left';
}
```

### Wall Slide

When falling against a wall, fall speed is capped at `WALL_SLIDE_SPEED` (1.5).

## Controls

### Keyboard

| Key | Action |
|-----|--------|
| Arrow Left / A | Move left (aim while charging) |
| Arrow Right / D | Move right (aim while charging) |
| Arrow Up / W | Climb up |
| Arrow Down / S | Climb down |
| Space (hold) | Charge jump |
| Space (release) | Execute jump |

### Mobile (Two-Zone Layout)

Touch controls with joystick and action buttons:

```
┌───────────────────────────────────────┐
│                                       │
│  ┌─────────┐              ┌─────────┐ │
│  │         │              │  Talk   │ │
│  │ Joystick│              │ (if NPC)│ │
│  │   ←↑→↓  │              ├─────────┤ │
│  │         │              │  Jump   │ │
│  └─────────┘              │ (charge)│ │
│                           └─────────┘ │
└───────────────────────────────────────┘
```

| Control | Action |
|---------|--------|
| Joystick | Move/aim in 8 directions |
| Jump button (hold) | Charge jump |
| Jump button (release) | Execute jump |
| Talk button | Interact with nearby NPC |

**Visual Feedback:**
- Jump button ring shows charge progress
- Color gradient: Green → Yellow (65%) → Red (90%)
- Percentage display while charging
- Pulse animation at 100% charge

## Navigation Menu

Top menubar with dropdown navigation using `@angular/aria`:
- Click section name to navigate
- Subsections show contextual info (only when in that section)
- Keyboard accessible (arrow keys, Enter, Escape)

## Deployment

### GitHub Pages

Automatic deployment via GitHub Actions on push to `main`:

```bash
# Manual deployment (disable font inlining if network issues)
NG_FONT_INLINING=false npm run build -- --base-href=/portfolio-game/
```

Live at: `https://[username].github.io/portfolio-game/`

**Asset Path Handling:**

All components that reference assets use dynamic `basePath` to support GitHub Pages:

```typescript
import { DOCUMENT } from '@angular/common';

export class MyComponent {
  private document = inject(DOCUMENT);
  readonly basePath = this.document.baseURI.replace(/\/$/, '');
}
```

```html
<!-- Template: Uses property binding for correct paths -->
<img [src]="basePath + '/assets/sprites/icon.png'" />
```

Components with basePath:
- `jump-button` - Jump button sprites
- `npc-interact-button` - Talk button icon
- `virtual-joystick` - Joystick pad and nub
- `section-title` - Section banner images

This ensures assets load correctly both on `localhost` and `username.github.io/portfolio-game/`.

## Development

### Prerequisites

- Node.js 18+
- Angular CLI 21+

### Setup

```bash
npm install
ng serve
```

### Build

```bash
ng build
```

### Project Structure Notes

- Uses Angular 21 standalone components (no NgModules)
- Zoneless change detection with OnPush throughout
- Signals for reactive state management
- Single unified RAF game loop (`GameLoopService`) with try-catch error handling
- Memory leak prevention with `DestroyRef` cleanup patterns
- NPCs and animations integrated into single game loop (no separate setInterval)
- Cached computed signals in TowerService for performance
- Visibility culling renders only visible tiles (~10-15 vs ~200 DOM nodes)

## Sprite Assets

Sprites are loaded from `/assets/sprites/`:
- `spritesheet-tiles-default.xml` - Terrain, items, decorations
- `spritesheet-characters-default.xml` - Player, NPCs, enemies

Frame naming convention:
- Terrain: `terrain_{type}_{position}` (e.g., `terrain_stone_horizontal_left`)
- Characters: `character_{color}_{action}_{frame}` (e.g., `character_green_walk_a`)
- Ladders: `ladder_top`, `ladder_middle`, `ladder_bottom`

## License

MIT
