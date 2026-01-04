import { Injectable, signal, computed, Signal } from '@angular/core';
import {
  WorldSection,
  SectionId,
  TerrainTile,
  Decoration,
  NPC,
  Ladder,
  SECTION_ORDER,
} from '../models/world.model';
import { AABB } from '../models/physics.model';
import { HERO_SECTION } from '../constants/sections/hero.config';
import { ABOUT_SECTION } from '../constants/sections/about.config';
import { SKILLS_SECTION } from '../constants/sections/skills.config';
import { PROJECTS_SECTION } from '../constants/sections/projects.config';
import { CONTACT_SECTION } from '../constants/sections/contact.config';
import { PHYSICS } from '../constants/physics-constants';
import { GAME_CONFIG } from '../constants/game-config';

/**
 * Tower configuration for Jump King style vertical progression
 */
export interface TowerConfig {
  sections: Record<SectionId, WorldSection>;
  sectionOrder: SectionId[];
  sectionHeight: number;
  totalHeight: number;
}

/**
 * Tower Service
 *
 * Manages the unified vertical tower world for Jump King style gameplay.
 * Stacks all sections vertically:
 *
 * CONTACT (top)    y: -2560 to -1920
 * PROJECTS         y: -1920 to -1280
 * SKILLS           y: -1280 to -640
 * ABOUT            y: -640 to 0
 * HERO (bottom)    y: 0 to 640
 *
 * Provides combined terrain, NPCs, ladders with transformed Y positions.
 */
@Injectable({ providedIn: 'root' })
export class TowerService {
  // Tower dimensions from centralized config
  readonly SECTION_HEIGHT = GAME_CONFIG.TOWER.SECTION_HEIGHT;
  readonly SECTION_COUNT = GAME_CONFIG.TOWER.SECTION_COUNT;
  readonly TOTAL_HEIGHT = this.SECTION_HEIGHT * this.SECTION_COUNT;

  // Section Y offsets (calculated from config - bottom = 0, higher = more negative)
  readonly sectionOffsets: Record<SectionId, number> = {
    hero: 0,
    about: -this.SECTION_HEIGHT,
    skills: -this.SECTION_HEIGHT * 2,
    projects: -this.SECTION_HEIGHT * 3,
    contact: -this.SECTION_HEIGHT * 4,
  };

  // Original sections (unmodified)
  private readonly sections: Record<SectionId, WorldSection> = {
    hero: HERO_SECTION,
    about: ABOUT_SECTION,
    skills: SKILLS_SECTION,
    projects: PROJECTS_SECTION,
    contact: CONTACT_SECTION,
  };

  // Current section signal (for UI)
  readonly currentSection = signal<SectionId>('hero');

  /**
   * Generic helper to aggregate items from all sections with Y offset
   */
  private aggregateItems<T extends { id: string }>(
    getter: (section: WorldSection) => T[],
    yTransform: (item: T, yOffset: number) => T
  ): T[] {
    const items: T[] = [];
    for (const sectionId of SECTION_ORDER) {
      const section = this.sections[sectionId];
      const yOffset = this.sectionOffsets[sectionId];
      for (const item of getter(section)) {
        items.push({
          ...yTransform(item, yOffset),
          id: `${sectionId}_${item.id}`,
        });
      }
    }
    return items;
  }

  /**
   * All terrain tiles with tower Y offsets applied (cached)
   */
  readonly allTerrain: Signal<TerrainTile[]> = computed(() =>
    this.aggregateItems(
      (s) => s.terrain,
      (tile, yOffset) => ({ ...tile, y: tile.y + yOffset })
    )
  );

  /**
   * All terrain colliders (AABB) with tower Y offsets (cached)
   */
  readonly allColliders: Signal<AABB[]> = computed(() =>
    this.allTerrain()
      .filter((tile) => tile.solid !== false)
      .map((tile) => ({
        x: tile.x,
        y: tile.y,
        width: PHYSICS.TILE_SIZE,
        height: PHYSICS.TILE_SIZE,
      }))
  );

  /**
   * All decorations with tower Y offsets (cached)
   */
  readonly allDecorations: Signal<Decoration[]> = computed(() =>
    this.aggregateItems(
      (s) => s.decorations,
      (deco, yOffset) => ({ ...deco, y: deco.y + yOffset })
    )
  );

  /**
   * All NPCs with tower Y offsets (cached)
   */
  readonly allNPCs: Signal<NPC[]> = computed(() =>
    this.aggregateItems(
      (s) => s.npcs,
      (npc, yOffset) => ({ ...npc, y: npc.y + yOffset })
    )
  );

  /**
   * All ladders with tower Y offsets (cached)
   */
  readonly allLadders: Signal<Ladder[]> = computed(() =>
    this.aggregateItems(
      (s) => s.ladders,
      (ladder, yOffset) => ({ ...ladder, topY: ladder.topY + yOffset })
    )
  );

  /**
   * Ladder colliders (AABB) for physics (cached)
   */
  readonly ladderColliders: Signal<AABB[]> = computed(() =>
    this.allLadders().map((ladder) => ({
      x: ladder.x,
      y: ladder.topY,
      width: PHYSICS.TILE_SIZE,
      height: ladder.heightTiles * PHYSICS.TILE_SIZE,
    }))
  );

  /**
   * Get section at given Y position
   * Offset makes background change after entering the new section (Jump King style)
   */
  getSectionAtY(y: number): SectionId {
    const offset = this.SECTION_HEIGHT - 60; // ~60px delay after entering new section
    if (y > 0) return 'hero';
    if (y > -this.SECTION_HEIGHT + offset) return 'hero';
    if (y > -this.SECTION_HEIGHT * 2 + offset) return 'about';
    if (y > -this.SECTION_HEIGHT * 3 + offset) return 'skills';
    if (y > -this.SECTION_HEIGHT * 4 + offset) return 'projects';
    return 'contact';
  }

  /**
   * Get section index (0 = hero, 4 = contact)
   */
  getSectionIndex(sectionId: SectionId): number {
    return SECTION_ORDER.indexOf(sectionId);
  }

  /**
   * Check if player is moving up (progressing)
   */
  isMovingUp(from: SectionId, to: SectionId): boolean {
    return this.getSectionIndex(to) > this.getSectionIndex(from);
  }

  /**
   * Get spawn point for tower (bottom of hero section)
   */
  getSpawnPoint(): { x: number; y: number } {
    const heroEntry = this.sections.hero.entry;
    return {
      x: heroEntry.x,
      y: this.sections.hero.groundLevel - PHYSICS.TILE_SIZE * 1.5,
    };
  }

  /**
   * Get spawn point for a specific section (for menubar teleport)
   */
  getSpawnPointForSection(sectionId: SectionId): { x: number; y: number } {
    const section = this.sections[sectionId];
    const yOffset = this.sectionOffsets[sectionId];
    return {
      x: section.entry.x,
      y: section.groundLevel + yOffset,
    };
  }

  /**
   * Get NPC position for a section (for menubar teleport)
   */
  getNPCPositionForSection(sectionId: SectionId): { x: number; y: number } {
    const section = this.sections[sectionId];
    const yOffset = this.sectionOffsets[sectionId];

    // Get first NPC of the section
    const npc = section.npcs[0];
    if (npc) {
      return {
        x: npc.x,
        y: npc.y + yOffset,
      };
    }

    // Fallback to entry point if no NPC
    return {
      x: section.entry.x,
      y: section.groundLevel + yOffset,
    };
  }

  /**
   * Get ground level for section
   */
  getGroundLevel(sectionId: SectionId): number {
    const section = this.sections[sectionId];
    const yOffset = this.sectionOffsets[sectionId];
    return section.groundLevel + yOffset;
  }

  /**
   * Get section title i18n key
   */
  getSectionTitle(sectionId: SectionId): string {
    return this.sections[sectionId].title;
  }

  /**
   * Get section terrain type
   */
  getSectionTerrainType(sectionId: SectionId): string {
    return this.sections[sectionId].terrainType;
  }

  /**
   * Get section background type
   */
  getSectionBackgroundType(sectionId: SectionId): string {
    return this.sections[sectionId].backgroundType;
  }

  /**
   * Get page width (same for all sections)
   */
  getPageWidth(): number {
    return this.sections.hero.width;
  }

  /**
   * Check if Y position is below the tower (fell out)
   */
  isBelowTower(y: number): boolean {
    return y > this.sections.hero.groundLevel + PHYSICS.TILE_SIZE * 2;
  }

  /**
   * Update current section based on player Y
   */
  updateCurrentSection(playerY: number): SectionId {
    const section = this.getSectionAtY(playerY);
    this.currentSection.set(section);
    return section;
  }
}
