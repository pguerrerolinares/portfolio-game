import { SpriteFrame } from '../models/sprite.model';

export function parseTxtMetadata(content: string): Map<string, SpriteFrame> {
  const frames = new Map<string, SpriteFrame>();
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Format: name = x y width height
    const match = trimmed.match(/^(\w+)\s*=\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$/);
    if (match) {
      const [, name, x, y, width, height] = match;
      frames.set(name, {
        name,
        x: parseInt(x, 10),
        y: parseInt(y, 10),
        width: parseInt(width, 10),
        height: parseInt(height, 10),
      });
    }
  }

  return frames;
}

export function parseXmlMetadata(content: string): Map<string, SpriteFrame> {
  const frames = new Map<string, SpriteFrame>();
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/xml');
  const subtextures = doc.querySelectorAll('SubTexture');

  subtextures.forEach((subtexture) => {
    const rawName = subtexture.getAttribute('name') || '';
    // Remove .png extension if present
    const name = rawName.replace(/\.png$/, '');
    const x = parseInt(subtexture.getAttribute('x') || '0', 10);
    const y = parseInt(subtexture.getAttribute('y') || '0', 10);
    const width = parseInt(subtexture.getAttribute('width') || '0', 10);
    const height = parseInt(subtexture.getAttribute('height') || '0', 10);

    frames.set(name, { name, x, y, width, height });
  });

  return frames;
}

export function parseMetadata(
  content: string,
  type: 'xml' | 'txt'
): Map<string, SpriteFrame> {
  return type === 'xml' ? parseXmlMetadata(content) : parseTxtMetadata(content);
}
