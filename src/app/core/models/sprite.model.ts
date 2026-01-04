/**
 * Represents a single frame within a sprite sheet.
 * Contains position and dimension data for rendering.
 */
export interface SpriteFrame {
  /** Frame identifier name */
  name: string;
  /** X position in the sprite sheet (pixels) */
  x: number;
  /** Y position in the sprite sheet (pixels) */
  y: number;
  /** Frame width (pixels) */
  width: number;
  /** Frame height (pixels) */
  height: number;
}

/**
 * Represents a loaded sprite sheet with all its frame data.
 */
export interface SpriteSheet {
  /** Unique identifier for this sprite sheet */
  id: string;
  /** Path to the sprite sheet image */
  imagePath: string;
  /** Total width of the sprite sheet image (pixels) */
  imageWidth: number;
  /** Total height of the sprite sheet image (pixels) */
  imageHeight: number;
  /** Map of frame names to frame data */
  frames: Map<string, SpriteFrame>;
}

/**
 * Configuration for loading a sprite sheet.
 * Used by SpriteLoaderService to load and parse sprite sheets.
 */
export interface SpriteSheetConfig {
  /** Unique identifier for this sprite sheet */
  id: string;
  /** Path to the sprite sheet image */
  imagePath: string;
  /** Path to the metadata file (XML or TXT) */
  metadataPath: string;
  /** Format of the metadata file */
  metadataType: 'xml' | 'txt';
}
