import { VideoAnnotationResult, ValidationError } from '../types';
import { parseTimestampToSeconds } from './timeUtils';

export function validateAnnotationResult(result: VideoAnnotationResult): ValidationError[] {
  const errors: ValidationError[] = [];

  // Suitability check
  if (!result.suitability) {
    errors.push({
      type: 'error',
      field: 'suitability',
      message: 'Suitability object is missing.'
    });
  }

  // Validate Scenes
  if (result.suitability?.status === 'suitable') {
    if (!result.scenes || result.scenes.length === 0) {
      errors.push({
        type: 'warning',
        field: 'scenes',
        message: 'Suitable video has no scene annotations defined.'
      });
    }

    result.scenes.forEach((scene, index) => {
      // ID Sequential Check
      if (scene.scene_id !== index + 1) {
        errors.push({
          type: 'warning',
          field: `scenes[${index}].scene_id`,
          message: `Scene ID is ${scene.scene_id}, expected sequential ID ${index + 1}.`
        });
      }

      // Check narrative description
      if (!scene.narrative_description || scene.narrative_description.trim().length < 10) {
        errors.push({
          type: 'warning',
          field: `scenes[${index}].narrative_description`,
          message: `Scene ${scene.scene_id} narrative description is short or missing.`
        });
      }
    });
  }

  return errors;
}
