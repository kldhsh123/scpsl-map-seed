import { generateFromTemplate } from './generator.js';
import { loadBundledTemplate } from './templates.js';

export { DotNetRandom } from './random.js';
export { MapGenerationError } from './errors.js';

export function generateMap(seed, options = {}) {
  return generateFromTemplate(loadBundledTemplate(), seed, options);
}

export function getTemplateInfo() {
  const template = loadBundledTemplate();
  return {
    gameVersion: template.game.version,
    buildType: template.game.buildType,
    activeHoliday: template.game.activeHoliday,
    rawSchemaVersion: template.schemaVersion,
    generatorCount: template.generators.length,
    roomTemplateCount: template.roomTemplates.length,
    glyphCount: template.glyphShapePairs.length,
    atlasCount: template.generators.reduce((count, generator) => count + (generator.atlases?.length ?? 0), 0)
  };
}
