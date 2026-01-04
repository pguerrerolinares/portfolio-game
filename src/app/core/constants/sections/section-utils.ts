import { TerrainTile } from '../../models/world.model';
import { PHYSICS } from '../physics-constants';

export const TILE = PHYSICS.TILE_SIZE;

// Mobile-first page dimensions (9:16 aspect ratio for modern phones)
export const PAGE_WIDTH = 384;   // 6 tiles wide
export const PAGE_HEIGHT = 640;  // 10 tiles tall
export const GROUND_Y = PAGE_HEIGHT - TILE; // Ground at bottom (y = 576)

// Vertical levels for 8-level layouts (90% vertical space usage)
export const LEVEL = {
  GROUND: GROUND_Y,           // y = 576 (base)
  L1: GROUND_Y - TILE,        // y = 512
  L2: GROUND_Y - TILE * 2,    // y = 448
  L3: GROUND_Y - TILE * 3,    // y = 384
  L4: GROUND_Y - TILE * 4,    // y = 320
  L5: GROUND_Y - TILE * 5,    // y = 256
  L6: GROUND_Y - TILE * 6,    // y = 192
  L7: GROUND_Y - TILE * 7,    // y = 128
  L8: GROUND_Y - TILE * 8,    // y = 64 (TOP)
} as const;

// Platform positions (left, center, right)
export const POS = {
  LEFT: 0,
  CENTER: TILE * 2,
  RIGHT: TILE * 4,
} as const;

/**
 * Generate horizontal terrain row
 * @param flush - 'left' = no left border (flush with screen edge), 'right' = no right border, 'both' = no borders
 */
export function terrain(
  startX: number,
  widthTiles: number,
  y: number,
  terrainPrefix: string,
  idPrefix: string,
  flush?: 'left' | 'right' | 'both'
): TerrainTile[] {
  const tiles: TerrainTile[] = [];

  const flushLeft = flush === 'left' || flush === 'both';
  const flushRight = flush === 'right' || flush === 'both';

  for (let i = 0; i < widthTiles; i++) {
    const x = startX + i * TILE;
    let frame: string;

    const isFirst = i === 0;
    const isLast = i === widthTiles - 1;

    if (widthTiles === 1) {
      // Single tile - check flush on both sides
      if (flushLeft && flushRight) {
        frame = `${terrainPrefix}_horizontal_middle`;
      } else if (flushLeft) {
        frame = `${terrainPrefix}_horizontal_right`;
      } else if (flushRight) {
        frame = `${terrainPrefix}_horizontal_left`;
      } else {
        frame = `${terrainPrefix}_horizontal_middle`;
      }
    } else if (isFirst) {
      frame = flushLeft ? `${terrainPrefix}_horizontal_middle` : `${terrainPrefix}_horizontal_left`;
    } else if (isLast) {
      frame = flushRight ? `${terrainPrefix}_horizontal_middle` : `${terrainPrefix}_horizontal_right`;
    } else {
      frame = `${terrainPrefix}_horizontal_middle`;
    }

    tiles.push({
      id: `${idPrefix}_${i}`,
      x,
      y,
      frame,
      solid: true,
    });
  }

  return tiles;
}

/**
 * Generate a filled block (multi-row terrain)
 */
export function block(
  startX: number,
  startY: number,
  widthTiles: number,
  heightTiles: number,
  terrainPrefix: string,
  idPrefix: string
): TerrainTile[] {
  const tiles: TerrainTile[] = [];

  for (let row = 0; row < heightTiles; row++) {
    for (let col = 0; col < widthTiles; col++) {
      const x = startX + col * TILE;
      const y = startY + row * TILE;
      let frameSuffix: string;

      // Determine position in block
      const isTop = row === 0;
      const isBottom = row === heightTiles - 1;
      const isLeft = col === 0;
      const isRight = col === widthTiles - 1;

      if (heightTiles === 1) {
        // Single row - use horizontal
        if (widthTiles === 1) {
          frameSuffix = 'horizontal_middle';
        } else if (isLeft) {
          frameSuffix = 'horizontal_left';
        } else if (isRight) {
          frameSuffix = 'horizontal_right';
        } else {
          frameSuffix = 'horizontal_middle';
        }
      } else {
        // Multi-row block
        if (isTop && isLeft) frameSuffix = 'block_top_left';
        else if (isTop && isRight) frameSuffix = 'block_top_right';
        else if (isTop) frameSuffix = 'block_top';
        else if (isBottom && isLeft) frameSuffix = 'block_bottom_left';
        else if (isBottom && isRight) frameSuffix = 'block_bottom_right';
        else if (isBottom) frameSuffix = 'block_bottom';
        else if (isLeft) frameSuffix = 'block_left';
        else if (isRight) frameSuffix = 'block_right';
        else frameSuffix = 'block_center';
      }

      tiles.push({
        id: `${idPrefix}_${row}_${col}`,
        x,
        y,
        frame: `${terrainPrefix}_${frameSuffix}`,
        solid: true,
      });
    }
  }

  return tiles;
}

