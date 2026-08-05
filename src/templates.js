import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MapGenerationError } from './errors.js';

const manifestPath = fileURLToPath(new URL('../data/manifest.json', import.meta.url));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const cache = new Map();

export function getDefaultVersion() {
  return manifest.defaultVersion;
}

export function getSupportedVersions() {
  return Object.keys(manifest.versions);
}

export function loadBundledTemplate(version = manifest.defaultVersion) {
  const fileName = manifest.versions[version];
  if (!fileName) {
    throw new MapGenerationError(`Unsupported game version: ${version}`, {
      supportedVersions: getSupportedVersions()
    });
  }
  if (!cache.has(version)) {
    const path = fileURLToPath(new URL(`../data/${fileName}`, import.meta.url));
    const template = JSON.parse(readFileSync(path, 'utf8'));
    validateTemplate(template, version);
    cache.set(version, template);
  }
  return cache.get(version);
}

export function validateTemplate(template, version = '<unknown>') {
  if (!template || !Array.isArray(template.glyphShapePairs) || !Array.isArray(template.generators) || !Array.isArray(template.roomTemplates)) {
    throw new MapGenerationError(`Invalid bundled template for ${version}`);
  }
  const ids = new Set(template.roomTemplates.map((room) => room.id));
  if (ids.size !== template.roomTemplates.length) {
    throw new MapGenerationError(`Duplicate room template id in ${version}`);
  }
  for (const pair of template.glyphShapePairs) {
    if (!Array.isArray(pair.rotations) || pair.rotations.length === 0) {
      throw new MapGenerationError(`Glyph ${pair.index} has no rotations`, { version });
    }
  }
  for (const generator of template.generators) {
    for (const id of generator.compatibleRoomTemplateIds ?? []) {
      if (!ids.has(id)) throw new MapGenerationError(`Missing room template: ${id}`, { version, generator: generator.index });
    }
    if (generator.prefabTemplateId && !ids.has(generator.prefabTemplateId)) {
      throw new MapGenerationError(`Missing single-room template: ${generator.prefabTemplateId}`, { version, generator: generator.index });
    }
    for (const atlas of generator.atlases ?? []) {
      const bytes = Buffer.from(atlas.rgbaBase64, 'base64');
      if (bytes.length !== atlas.width * atlas.height * 4) {
        throw new MapGenerationError(`Invalid atlas pixels: ${atlas.name}`, { version, generator: generator.index });
      }
    }
  }
  return template;
}
