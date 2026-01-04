import { WorldSection } from '../../models/world.model';
import { TILE, PAGE_WIDTH, PAGE_HEIGHT, GROUND_Y, LEVEL, terrain } from './section-utils';

/**
 * CONTACT SECTION - Cima Final con Escalera
 * Theme: stone/clouds
 * NPC: Frog (farewell + contact links)
 * Difficulty: ⭐ (Easy - ladder backup!)
 *
 * TOWER MODE: Meta final de la torre
 * Escalera como opción fácil + plataformas para speedrunners
 * Victoria al llegar arriba
 *
 * Layout (Final Summit):
 *  Y=64  ████████████████████ 🐸    ← META (Victoria!)
 *  Y=160 ▓▓                        ← Ladder
 *  Y=256 ▓▓          ████████      ← Plataforma derecha
 *  Y=352 ▓▓  ████████              ← Plataforma izquierda
 *  Y=448 ▓▓          ████████      ← Plataforma derecha
 *  Y=576 ████            ████████████ ← Ground dividido (hueco centro)
 *              ↑ entrada desde PROJECTS
 */
export const CONTACT_SECTION: WorldSection = {
  id: 'contact',
  width: PAGE_WIDTH,
  height: PAGE_HEIGHT,
  groundLevel: GROUND_Y,
  terrainType: 'stone',
  backgroundType: 'clouds',
  terrain: [
    // Ground dividido (hueco centro para entrada desde PROJECTS, izq para ladder)
    ...terrain(0, 1, GROUND_Y, 'terrain_stone', 'contact_ground_l', 'left'),
    ...terrain(TILE * 4, 2, GROUND_Y, 'terrain_stone', 'contact_ground_r', 'right'),

    // Alternative platforms for jumpers (right side)
    // P1 (right) - y=448
    ...terrain(TILE * 3, 2, LEVEL.L2, 'terrain_stone', 'contact_p1'),

    // P2 (left) - y=352
    ...terrain(TILE, 2, LEVEL.L3, 'terrain_stone', 'contact_p2'),

    // P3 - y=224 (bajada y a la izquierda)
    ...terrain(TILE * 2.5, 2, LEVEL.L5 + 32, 'terrain_stone', 'contact_p3'),

    // Victory platform (wide) - y=128 - META
    ...terrain(0, 4, LEVEL.L7, 'terrain_stone', 'contact_victory', 'left'),
  ],
  decorations: [
    // Victory flag on top platform (positioned on surface)
    { id: 'contact_flag', x: TILE * 3, y: LEVEL.L7 - 32, frame: 'flag_blue_a', sheet: 'tiles' },
    // Torch on ground (near spawn)
    { id: 'contact_torch1', x: TILE * 4 + 16, y: GROUND_Y - 32, frame: 'torch_on_a', sheet: 'tiles' },
  ],
  enemies: [],
  items: [],
  // No exits - this is the final destination (victory!)
  exits: [],
  ladders: [
    {
      id: 'contact_ladder',
      x: TILE * 0.5, // Left side ladder
      topY: LEVEL.L7, // Starts at victory platform
      heightTiles: 7, // Ground to top
    },
  ],
  npcs: [
    {
      id: 'contact_frog',
      x: TILE * 2, // On victory platform
      y: LEVEL.L7 - TILE, // On top of platform
      sprite: 'frog',
      name: 'npcs.frog.name',
      dialogue: [
        'npcs.contact.frog.line1',
        'npcs.contact.frog.line2',
        'npcs.contact.frog.line3',
      ],
      patrolMinX: TILE,
      patrolMaxX: TILE * 3 - 48,
      patrolSpeed: 0.3,
      externalLink: 'https://github.com/pjhartwig',
    },
  ],
  entry: {
    x: TILE * 2, // Spawn center on ground
    type: 'fall',
    direction: 'right',
  },
  title: 'sections.contact.title',
};
